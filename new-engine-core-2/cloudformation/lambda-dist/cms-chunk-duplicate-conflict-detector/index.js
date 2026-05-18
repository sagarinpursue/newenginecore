import { BedrockAgentRuntimeClient, InvokeAgentCommand } from '@aws-sdk/client-bedrock-agent-runtime';

import middy from '@middy/core';
import httpJsonBodyParser from '@middy/http-json-body-parser';
import inputOutputLogger from '@middy/input-output-logger';
import secretsManager from '@middy/secrets-manager';
import validator from '@middy/validator';

import Ajv from 'ajv';
import ajvErrors from 'ajv-errors';
import ajvFormats from 'ajv-formats';

import { CmsAnalysisIssueDbApi, CmsDocumentQuestionDbApi, CmsIssueChunkDbApi } from '@shared-modules/f2-db-api';
import { httpErrorFormatter, httpResponseFormatter } from '@shared-modules/f2-middlewares';

import { eventSchema } from './schemas/event.js';

// Env variables
const DB_API_URL = process.env.DB_API_URL;
const JWT_AUTHORIZER_SECRET = process.env.JWT_AUTHORIZER_SECRET;
const AWS_REGION = process.env.AWS_REGION;

// Clients
const bedrockAgentRuntimeClient = new BedrockAgentRuntimeClient({ region: AWS_REGION });

// Create AJV instance and configure it with ajv-errors and ajv-formats
const ajv = new Ajv({ coerceTypes: 'number', strictTypes: false, allowUnionTypes: true, allErrors: true });
ajvFormats(ajv);
ajvErrors(ajv);

// TBD: need to limit number of questions and chunks per question
export const handler = middy(async (event, context) => {
    console.log('event:', event);

    const cmsDocumentQuestionDbApi = new CmsDocumentQuestionDbApi(DB_API_URL, context.jwtAuth.anonKey);
    const cmsAnalysisIssueDbApi = new CmsAnalysisIssueDbApi(DB_API_URL, context.jwtAuth.anonKey);
    const cmsIssueChunkDbApi = new CmsIssueChunkDbApi(DB_API_URL, context.jwtAuth.anonKey);

    const { reportId, chunksPerQuestion } = event.body;

    const documentQuestionRecords = await cmsDocumentQuestionDbApi.getQuestions(reportId);

    let questionList = [];
    for (const record of documentQuestionRecords) {
        const questions = record.questions.split(';');
        questionList = questionList.concat(questions);
    }
    // console.log('questionList:', questionList);

    for (const question of questionList) {
        const payload = await invokeInterviewedAgent(question, chunksPerQuestion);
        const chunks = extractAgentChunks(payload);
        const result = await invokeCompAgent(chunks);

        for (const issue of JSON.parse(result.messageText)) {
            // TODO: insertMany probably will be better
            const issueData = {
                question: question,
                summary: issue.summary,
                reportId: reportId,
                issueType: issue.issueType,
            };
            const { issue_id } = await cmsAnalysisIssueDbApi.addIssue(issueData);

            // TODO: insertMany probably will be better
            for (const chunk of issue.chunks) {
                const chunkData = {
                    ...chunk,
                    issue_id,
                };
                await cmsIssueChunkDbApi.addChunk(chunkData);
            }
        }

        // console.log('chunks:', chunks);
        // console.log('chunks.length:', chunks.length);
        console.log(result);
    }

    return {
        data: 'Job 2 successfully finished.',
    };
}).use([
    inputOutputLogger(),
    httpJsonBodyParser({
        disableContentTypeError: true,
    }),
    secretsManager({
        fetchData: {
            jwtAuth: JWT_AUTHORIZER_SECRET,
        },
        disablePrefetch: true,
        setToContext: true,
    }),
    validator({ eventSchema: ajv.compile(eventSchema) }),
    httpResponseFormatter(),
    httpErrorFormatter(),
]);

const decodeCompletionStream = async ({ completion }) => {
    if (completion === undefined) {
        throw new Error('Completion is undefined');
    }

    let result = {
        files: [],
        traces: [],
        sources: [],
        messageText: '',
        from: 'ai-agent',
    };

    for await (const chunkEvent of completion) {
        if (chunkEvent.trace) {
            // console.log('Trace event:', JSON.stringify(chunkEvent.trace, null, 2));
            result.traces.push(chunkEvent.trace);
        }

        if (chunkEvent.files) {
            result.files = [...chunkEvent.files.files];
        }

        if (chunkEvent.chunk) {
            // TODO [IM] Not clear to me when 'citations' array will have more than 1 element
            if (chunkEvent.chunk.attribution?.citations?.length > 1) {
                console.log('>>>>> Citations Length more than 1');
                console.log(JSON.stringify(chunkEvent.chunk.attribution.citations));
            }

            if (chunkEvent.chunk.attribution?.citations?.[0]?.retrievedReferences) {
                const refs = chunkEvent.chunk.attribution.citations[0].retrievedReferences;

                for (const ref of refs) {
                    if (ref?.metadata?.['x-amz-bedrock-kb-source-uri']) {
                        //ref?.location?.type === 'WEB' &&
                        result.sources.push(ref.metadata['x-amz-bedrock-kb-source-uri']);
                    }
                }
            }

            const chunk = chunkEvent.chunk;
            const decodedResponse = new TextDecoder('utf-8').decode(chunk.bytes);
            result.messageText += decodedResponse;
        }
    }

    return result;
};

const invokeInterviewedAgent = async (question, chunksPerQuestion) => {
    // TODO: hardcoded values below
    const input = question;
    const agentId = 'XEUUZRCMDP';
    const agentAliasId = 'GBQFQHPLNN';
    const sessionId = '111dcaff-f65f-4f3a-8e96-5fc9665c4502';
    const knowledgeBaseId = 'EUJ577GY6V';

    const params = {
        agentId: agentId,
        enableTrace: true,
        sessionId: sessionId,
        agentAliasId: agentAliasId,
        inputText: input,
        sessionState: {
            knowledgeBaseConfigurations: [
                {
                    knowledgeBaseId: knowledgeBaseId,
                    retrievalConfiguration: {
                        vectorSearchConfiguration: {
                            numberOfResults: chunksPerQuestion,
                        },
                    },
                },
            ],
        },
    };

    const response = await bedrockAgentRuntimeClient.send(new InvokeAgentCommand(params));
    return await decodeCompletionStream(response);
};

const invokeCompAgent = async (chunks) => {
    // TODO: hardcoded values below
    const input = JSON.stringify(chunks);
    const agentId = 'GXQUENMWZF';
    const agentAliasId = 'DCJX9ZUGOY';
    const sessionId = '3f2a1b7c-8d9f-4b02-b6e4-72f92a6c9c31';

    const params = {
        agentId: agentId,
        sessionId: sessionId,
        agentAliasId: agentAliasId,
        inputText: input,
    };

    const response = await bedrockAgentRuntimeClient.send(new InvokeAgentCommand(params));
    return await decodeCompletionStream(response);
};

const extractAgentChunks = (payload) => {
    const chunks = [];
    for (const trace of payload.traces) {
        if (JSON.stringify(trace).includes('knowledgeBaseLookupOutput')) {
            for (const retrievedReference of trace.trace.orchestrationTrace.observation.knowledgeBaseLookupOutput
                .retrievedReferences) {
                const chunk = {
                    chunkId: retrievedReference.metadata['x-amz-bedrock-kb-chunk-id'],
                    s3Location: retrievedReference.location.s3Location.uri,
                    text: retrievedReference.content.text,
                };
                chunks.push(chunk);
            }
        }
    }
    return chunks;
};
