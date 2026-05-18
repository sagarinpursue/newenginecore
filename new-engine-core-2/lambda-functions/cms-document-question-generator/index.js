// Native and 3rd party Node modules
import { BedrockAgentRuntimeClient, InvokeAgentCommand } from '@aws-sdk/client-bedrock-agent-runtime';
import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';

import middy from '@middy/core';
import httpJsonBodyParser from '@middy/http-json-body-parser';
import inputOutputLogger from '@middy/input-output-logger';
import secretsManager from '@middy/secrets-manager';
import validator from '@middy/validator';

import Ajv from 'ajv';
import ajvErrors from 'ajv-errors';
import ajvFormats from 'ajv-formats';

// Custom Node modules
import CmsDocumentQuestionDbApi from '@shared-modules/f2-db-api';
import { httpErrorFormatter, httpResponseFormatter } from '@shared-modules/f2-middlewares';

import { eventSchema } from './schemas/event.js';

// Env variables
const DB_API_URL = process.env.DB_API_URL;
const JWT_AUTHORIZER_SECRET = process.env.JWT_AUTHORIZER_SECRET;
const AWS_REGION = process.env.AWS_REGION;

// Create AJV instance and configure it with ajv-errors and ajv-formats
const ajv = new Ajv({ coerceTypes: 'number', strictTypes: false, allowUnionTypes: true, allErrors: true });
ajvFormats(ajv);
ajvErrors(ajv);

const s3Client = new S3Client({ region: AWS_REGION });
const bedrockAgentRuntimeClient = new BedrockAgentRuntimeClient({ region: AWS_REGION });

export const handler = middy(async (event, context) => {
    const cmsDocumentQuestionDbApi = new CmsDocumentQuestionDbApi(DB_API_URL, context.jwtAuth.anonKey);
    // TODO: [mk] - we have a problem with empty spaces in string cause it converts to %, so it breaks up the logic (it's regarding when the string contains file)
    const url = new URL(event.body.bucketUri);
    const bucketName = url.hostname;
    const protocol = url.protocol;
    const isFolder = event.body.bucketUri.endsWith('/');
    const prefix = url.pathname.startsWith('/') ? url.pathname.substring(1) : url.pathname;

    let data = [];

    if (isFolder) {
        const { keys } = await getAllObjectKeys(bucketName, prefix);
        const allContentPromises = keys.map(async (key) => {
            const command = new GetObjectCommand({ Bucket: bucketName, Key: key });
            const response = await s3Client.send(command);
            const content = await streamToString(response.Body);
            return { key, content };
        });
        data = await Promise.all(allContentPromises);
    } else {
        const command = new GetObjectCommand({ Bucket: bucketName, Key: prefix });
        const response = await s3Client.send(command);
        const content = await streamToString(response.Body);
        data = [{ key: prefix, content: content }];
    }

    const input = JSON.stringify({
        questionsPerDocument: event.body.questionsPerDocument,
        data,
    });

    // TODO: hardcode
    const agentId = 'QND3MWEXPY';
    const agentAliasId = 'MKPUMTSTSV';

    const response = await invokeBedrockAgent(input, agentId, agentAliasId);
    const payload = await decodeCompletionStream(response);
    const output = JSON.parse(payload.messageText);

    for (const { key, questions } of output) {
        // TODO: addQuestions - should be insert many, need to add all questions in one straight request
        await cmsDocumentQuestionDbApi.addQuestions({
            questions: questions,
            s3Uri: `${protocol}//${bucketName}/${key}`,
            reportId: event.body.reportId,
        });
    }

    return {
        data: 'Job 1 successfully finished.',
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

const getAllObjectKeys = async (bucketName, prefix) => {
    const allObjectKeys = [];
    let isTruncated = true;
    let continuationToken;

    while (isTruncated) {
        const command = new ListObjectsV2Command({
            Bucket: bucketName,
            Prefix: prefix,
            ContinuationToken: continuationToken,
        });
        const response = await s3Client.send(command);
        if (response.Contents) {
            response.Contents.forEach((item) => {
                if (!item.Key.endsWith('/')) {
                    allObjectKeys.push(item.Key);
                }
            });
        }
        isTruncated = response.IsTruncated;
        continuationToken = response.NextContinuationToken;
    }

    return {
        bucket: bucketName,
        keys: allObjectKeys,
    };
};

const streamToString = (stream) =>
    new Promise((resolve, reject) => {
        const chunks = [];
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('error', reject);
        stream.on('end', () => {
            resolve(Buffer.concat(chunks).toString('utf-8'));
        });
    });

const invokeBedrockAgent = async (input, agentId, agentAliasId) => {
    const params = {
        agentId: agentId,
        // TODO: hardcoded
        sessionId: '29cd0f52-8d84-47a4-b291-31b6105a680f',
        agentAliasId: agentAliasId,
        inputText: input,
    };

    return await bedrockAgentRuntimeClient.send(new InvokeAgentCommand(params));
};

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
