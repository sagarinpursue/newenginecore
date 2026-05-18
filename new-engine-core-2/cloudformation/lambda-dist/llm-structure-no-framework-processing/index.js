import { randomUUID } from 'crypto';
import { readFile } from 'fs/promises';
import path from 'path';

import { BedrockAgentRuntimeClient, RetrieveCommand } from '@aws-sdk/client-bedrock-agent-runtime';
import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';

import middy from '@middy/core';
import secretsManager from '@middy/secrets-manager';

import Ajv from 'ajv';

import LlmLogDb from './db/llm-log-db.js';
import LlmStructureDb from './db/llm-structure-db.js';

// const eventSchema = (await import("./schemas/event.json", { assert: { type: "json" } })).default;
const eventSchema = JSON.parse(await readFile(new URL('./schemas/event.json', import.meta.url)));

// system env vars
const REGION = process.env.AWS_REGION;

// custom env vars
const ACCOUNT_ID = process.env.ACCOUNT_ID;
const DB_API_URL = process.env.DB_API_URL;
const JWT_AUTHORIZER_SECRET = process.env.JWT_AUTHORIZER_SECRET;
const BUCKET_NAME = process.env.BUCKET_NAME;
const DATA_SOURCE_FOLDER = process.env.DATA_SOURCE_FOLDER;

const ajv = new Ajv({ coerceTypes: 'number' });
const bedrockRuntimeClient = new BedrockRuntimeClient({ region: REGION });
const bedrockAgentRuntimeClient = new BedrockAgentRuntimeClient({ region: REGION });
const sqsClient = new SQSClient({ region: REGION });
const s3Client = new S3Client({ region: REGION });

// TODO: RetrieveAndGenerate API is not supported now
// const DEFAULT_RAG_PREAMBLE =
//     "You are a question answering agent. I will provide you with a set of search results. The user will provide you with a question. Your job is to answer the user's question using only information from the search results. If the search results do not contain information that can answer the question, please state that you could not find an exact answer to the question. Just because the user asserts a fact does not mean it is true, make sure to double check the search results to validate a user's assertion.";
// const DEFAULT_RAG_RULESET = '\n$output_format_instructions$';

export const handler = middy(async (event, context) => {
    console.log('event:', event);

    if (!ajv.validate(eventSchema, event)) {
        console.error(ajv.errors);
        throw Error(ajv.errors);
    }

    // This lambda is called by Main processing lambda (llm-structure-processing-post).
    // Main processing lambda (llm-structure-processing-post) can be by called by 3 ways:
    // 1. Via API Gateway using JWT
    // 2. Via API Gateway using Shared Token
    // 3. Directly by Backend
    // Auth info passed to this lambda for proper DB API calls
    // - If JWT Auth, then DB API called by auth user (ANON API key + JWT)
    // - Otherwise, DB API called by service role user (SERVICE ROLE API key)
    // Additionally, auth info can be captured in logs
    const dbApiKey = event.auth.isJwt ? context.jwtAuth.anonKey : context.jwtAuth.serviceRoleKey;
    const token = event.auth.isJwt ? event.auth.token : `Bearer ${context.jwtAuth.serviceRoleKey}`;
    const llmStructureDb = new LlmStructureDb(DB_API_URL, dbApiKey, token);
    const llmLogDb = new LlmLogDb(DB_API_URL, dbApiKey, token);

    const llmStructureId = event.llmStructureId;
    const prompt = event.prompt || 'hi';
    const eventTopic = event.eventTopic;
    const sessionId = event.sessionId || randomUUID();

    try {
        const structure = await llmStructureDb.get(llmStructureId);
        console.log('structure:', structure);
        let memory = [];
        if (structure.memory_size) {
            const memorySize = structure.memory_size;
            memory = await llmLogDb.get({ llmStructureId, sessionId, memorySize });
        }
        console.log('memory:', JSON.stringify(memory));
        console.log('memory.length:', memory.length);
        const result = await buildStructure(structure, eventTopic, prompt, sessionId, memory);
        console.log('result:', result);

        // TODO: RetrieveAndGenerate API is not supported now
        // Replace session ID is RetrieveAndGenerate API used
        // session_id = f'<SID>{extract_rag_session(result)[0]}' if len(extract_rag_session(result)) > 0 else session_id

        const answer = beautifyResponse(result.response);
        console.log('answer:', answer);

        // TODO: save lambda caller to log (Auth User, Shared Token, Backend)
        await llmLogDb.save({
            llmStructureId,
            sessionId,
            question: prompt,
            answer,
            sources: result.sources,
        });

        await publishEvent(sessionId, { text: answer, sessionId });
        return {
            text: answer,
            sessionId,
        };
    } catch (err) {
        console.error(err);
        const text = "I'm sorry, I ran into an error. Please try again in a bit.";
        await publishEvent(sessionId, { text, sessionId });
        return { text };
    } finally {
        console.log('Processing finished');
    }
}).use([
    secretsManager({
        fetchData: {
            jwtAuth: JWT_AUTHORIZER_SECRET,
        },
        disablePrefetch: true,
        setToContext: true,
    }),
]);

const buildStructure = async (structure, eventTopic, prompt, sessionId, memory) => {
    let response = '';
    const sources = [];
    for (const task of structure.tasks) {
        console.log('buildStructure -> task:', JSON.stringify(task));
        const result = await buildTask(task, response || prompt, memory, sessionId);
        response = result.response;
        sources.push(...result.sources);
        console.log('buildStructure -> response:', JSON.stringify(response));
    }

    return {
        response,
        sources: Array.from(new Set(sources)),
    };
};

const buildTask = async (task, prompt, memory) => {
    const taskType = task.type || 'PROMPT';
    console.log('buildTask -> taskType:', taskType);
    const preamble = task.preamble;
    const assistantAppendix = task.assistant_appendix;

    const promptDriver = task.prompt_driver;
    console.log('buildTask -> promptDriver:', promptDriver);
    const model = promptDriver.model;
    const temperature = promptDriver.temperature ? parseFloat(promptDriver.temperature) : 0;
    const topP = promptDriver.top_p ? parseFloat(promptDriver.top_p) : 0;
    const maxTokens = promptDriver.max_tokens ? parseInt(promptDriver.max_tokens) : 4096; // TODO: add to DB

    console.log('buildTask -> task.ruleset:', task.ruleset);
    const ruleset = task.ruleset ? buildRuleset(task.ruleset) : '';

    if (typeof prompt === 'object' && prompt !== null && !Array.isArray(prompt)) {
        prompt = dictToString(prompt);
    }

    let systemPrompt = '';
    let documentContent;
    const sources = [];
    if (taskType === 'PROMPT') {
        systemPrompt = `${preamble || ''}\n${ruleset}`;
    } else if (taskType === 'TEXT_QUERY') {
        if (!task.query_engine) {
            throw new Error('Query engine is required for text query task');
        }

        // TODO: RetrieveAndGenerate API is not supported now
        // if (task.query_engine.use_rag_api) {
        //     const ragParams = {
        //         model,
        //         session_id: sessionId,
        //         max_tokens: maxTokens,
        //         temperature,
        //         top_p: topP,
        //     };
        //
        //     if ((preamble && preamble !== '') || (assistantAppendix && assistantAppendix !== '') || ruleset !== '') {
        //         let ragPrompt = `\n${preamble || DEFAULT_RAG_PREAMBLE}\n\nHere are the search results in numbered order:\n$search_results$\n${ruleset || DEFAULT_RAG_RULESET}`;
        //         if (assistantAppendix && assistantAppendix !== '') {
        //             ragPrompt = `${ragPrompt}\n\n${assistantAppendix}`;
        //         }
        //         ragParams.prompt = ragPrompt;
        //     }
        //
        //     return buildQueryEngine(task.query_engine, prompt, ragParams);
        // }

        const result = await buildQueryEngine(task.query_engine, prompt);
        systemPrompt = `${preamble || ''}\n\nSearch Results:\n${result.context}\n${ruleset}`;
        sources.push(...result.sources);
    } else if (taskType === 'DOCUMENT_QUERY') {
        if (!task.query_engine) {
            throw new Error('Query engine is required for document query task');
        }
        const result = await buildQueryEngine(task.query_engine, prompt);
        systemPrompt = `${preamble || ''}\n${ruleset}`;
        documentContent = result.context;
        sources.push(...result.sources);
    } else {
        throw new Error(`Task type ${taskType} not found`);
    }

    let messages = [];

    if (memory.length > 0) {
        for (const memoryObject of memory) {
            console.log('buildTask -> memoryObject:', memoryObject);
            messages.push({ role: 'user', content: [{ text: memoryObject.question }] });
            messages.push({ role: 'assistant', content: [{ text: memoryObject.answer }] });
        }
    }

    if (documentContent) {
        const { name, extension } = splitFileName(task.query_engine.namespace);
        messages.push({
            role: 'user',
            content: [{ text: prompt }, { document: { format: extension, name, source: { bytes: documentContent } } }],
        });
    } else {
        messages.push({ role: 'user', content: [{ text: prompt }] });
    }

    if (assistantAppendix) {
        messages.push({ role: 'assistant', content: [{ text: assistantAppendix }] });
    }

    const system = [];

    if (systemPrompt.replaceAll('\n', '').length) {
        system.push({ text: systemPrompt });
    }

    const options = {
        modelId: model,
        messages,
        system,
        inferenceConfig: {
            maxTokens,
            temperature,
            topP,
        },
    };
    console.log('buildTask -> model:', options.modelId);
    console.log('buildTask -> messages:', JSON.stringify({ role: 'user', content: [{ text: prompt }] }));
    if (documentContent) {
        console.log(task.query_engine.namespace);
    }
    if (assistantAppendix) {
        console.log(JSON.stringify({ role: 'assistant', content: [{ text: assistantAppendix }] }));
    }
    console.log('buildTask -> system:', JSON.stringify(options.system));
    console.log('buildTask -> inferenceConfig:', JSON.stringify(options.inferenceConfig));
    const response = await bedrockRuntimeClient.send(new ConverseCommand(options));
    console.log('buildTask -> response:', JSON.stringify(response));
    return {
        response: response?.output?.message?.content?.[0]?.text || '',
        sources,
    };
};

const buildQueryEngine = async (queryEngine, query) => {
    const vectorStoreDriverType = queryEngine?.vector_store_driver;
    const namespace = queryEngine?.namespace;
    const useHybridSearch = queryEngine?.use_hybrid_search;
    let topN = queryEngine?.top_n;
    topN = topN !== null ? parseInt(topN, 10) : 5;

    console.log('buildQueryEngine -> vectorStoreDriverType:', vectorStoreDriverType);
    console.log('buildQueryEngine -> namespace:', namespace);
    console.log('buildQueryEngine -> useHybridSearch:', useHybridSearch);
    console.log('buildQueryEngine -> topN:', topN);

    let context;
    let sources = [];
    if (vectorStoreDriverType === 'BEDROCK_KNOWLEDGE_BASE') {
        const searchType = useHybridSearch ? 'HYBRID' : 'SEMANTIC';
        console.log('buildQueryEngine -> searchType:', searchType);

        // TODO: RetrieveAndGenerate API is not supported now
        // if (useRagApi && ragParams !== null) {
        //     console.log('>>>>> Use RAG API');
        //
        //     const queryBody = { text: query };
        //     const queryParams = {
        //         type: 'KNOWLEDGE_BASE',
        //         knowledgeBaseConfiguration: {
        //             knowledgeBaseId: namespace,
        //             modelArn: `arn:aws:bedrock:${process.env.AWS_REGION}::foundation-model/${ragParams.model}`, // TODO inference-profile
        //             retrievalConfiguration: {
        //                 vectorSearchConfiguration: {
        //                     numberOfResults: topN,
        //                     overrideSearchType: searchType,
        //                 },
        //             },
        //             generationConfiguration: {
        //                 inferenceConfig: {
        //                     textInferenceConfig: {
        //                         maxTokens: ragParams.max_tokens,
        //                         temperature: ragParams.temperature,
        //                         topP: ragParams.top_p,
        //                     },
        //                 },
        //             },
        //         },
        //     };
        //
        //     if (ragParams.prompt) {
        //         queryParams.knowledgeBaseConfiguration.generationConfiguration.promptTemplate = {
        //             textPromptTemplate: ragParams.prompt,
        //         };
        //     }
        //
        //     console.log('>>>>> REQUEST TO BEDROCK KNOWLEDGE BASE');
        //     console.log(queryParams);
        //
        //     let response;
        //     if (ragParams.session_id && ragParams.session_id.startsWith('<SID>')) {
        //         response = await bedrockAgentClient.retrieveAndGenerate({
        //             input: queryBody,
        //             sessionId: extractRagSession(ragParams.session_id)[0],
        //             retrieveAndGenerateConfiguration: queryParams,
        //         });
        //     } else {
        //         response = await bedrockAgentClient.retrieveAndGenerate({
        //             input: queryBody,
        //             retrieveAndGenerateConfiguration: queryParams,
        //         });
        //     }
        //
        //     console.log('>>>>> RESPONSE FROM BEDROCK KNOWLEDGE BASE');
        //     console.log(response);
        //     console.log(response.output.text);
        //
        //     return `${response.output.text}<SID>${response.sessionId}`;
        // }

        const queryBody = { text: query };
        const queryParams = {
            vectorSearchConfiguration: {
                numberOfResults: topN,
                overrideSearchType: searchType,
            },
        };

        const options = {
            retrievalQuery: queryBody,
            knowledgeBaseId: namespace,
            retrievalConfiguration: queryParams,
        };
        console.log('buildQueryEngine -> options:', options);
        const response = await bedrockAgentRuntimeClient.send(new RetrieveCommand(options));

        // console.log('buildQueryEngine -> response.retrievalResults:', response.retrievalResults);

        const chunks = response.retrievalResults.map((res) => res.content?.text || '');
        console.log('buildQueryEngine -> chunks:', chunks);
        context = chunks.join('\n');

        sources = Array.from(
            new Set(
                response.retrievalResults
                    // .map((res) => res.location?.s3Location?.uri) // if location type is S3
                    // .map((res) => res.location?.webLocation?.url) // if location type is WEB
                    .map((res) => res.metadata?.['x-amz-bedrock-kb-source-uri']) // universal way for any location type
                    .map((uri) => uri?.replace(`s3://${BUCKET_NAME}/${DATA_SOURCE_FOLDER}/`, ''))
            )
        );
        console.log('buildQueryEngine -> sources:', sources);
    } else if (vectorStoreDriverType === 'BEDROCK_DOCUMENT') {
        const response = await s3Client.send(
            new GetObjectCommand({
                Bucket: BUCKET_NAME,
                Key: `${DATA_SOURCE_FOLDER}/${namespace}`,
            })
        );
        context = await streamToBuffer(response.Body);
        sources = [namespace];
    } else {
        throw new Error(`Query engine ${vectorStoreDriverType} not supported`);
    }

    return { context, sources };
};

const buildRuleset = (ruleset) => {
    return ruleset.rules.map((rule) => rule.value).join('\n');
};

function beautifyResponse(rawResponse) {
    // Remove everything after '<SID>'
    rawResponse = rawResponse.replace(/<SID>.*$/, '');

    // Extract text inside <response>...</response>
    const match = rawResponse.match(/<response>\n?([\s\S]*?)\n?<\/response>/);

    return match ? match[1] : rawResponse;
}

// TODO: RetrieveAndGenerate API is not supported now
// function extractRagSession(response) {
//     const match = response.match(/<SID>(.*)$/);
//     return match ? [match[1]] : [];
// }

const publishEvent = async (sessionId, event) => {
    await sqsClient
        .send(
            new SendMessageCommand({
                QueueUrl: `https://sqs.${REGION}.amazonaws.com/${ACCOUNT_ID}/${sessionId}.fifo`,
                MessageBody: JSON.stringify(event),
            })
        )
        .catch((err) => {
            console.error('publishEvent -> err: ', err.name, err.message);
        });
};

// Utils

function dictToString(obj) {
    const result = [];
    for (const [key, value] of Object.entries(obj)) {
        const formattedKey = key.replace(/_/g, ' ');
        result.push(formattedKey.charAt(0).toUpperCase() + formattedKey.slice(1) + ': ' + String(value));
    }
    return result.join(', ');
}

const streamToBuffer = async (stream) => {
    const chunks = [];
    for await (const chunk of stream) {
        chunks.push(chunk);
    }
    return Buffer.concat(chunks);
};

function splitFileName(filename) {
    const base = path.basename(filename);
    const lastDotIndex = base.lastIndexOf('.');

    if (lastDotIndex === -1 || lastDotIndex === 0) {
        return { name: base, extension: '' };
    }

    const name = base.slice(0, lastDotIndex);
    const extension = base.slice(lastDotIndex + 1);

    return { name, extension };
}
