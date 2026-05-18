import middy from '@middy/core';
import httpJsonBodyParser from '@middy/http-json-body-parser';
import inputOutputLogger from '@middy/input-output-logger';
import secretsManager from '@middy/secrets-manager';
import validator from '@middy/validator';

import Ajv from 'ajv';
import ajvErrors from 'ajv-errors';
import ajvFormats from 'ajv-formats';

import { httpResponseFormatter, httpErrorFormatter } from '@shared-modules/f2-middlewares';

// Custom Node modules
import { eventSchema } from './schemas/event.js';
import AiDataSourceService from './services/ai-data-source.service.js';
import AwsAossService from './services/aws-aoss.service.js';
import AwsBedrockService from './services/aws-bedrock.service.js';
import AwsS3vectorsService from './services/aws-s3vectors.service.js';

// Create AJV instance and configure it with ajv-errors and ajv-formats
const ajv = new Ajv({ coerceTypes: 'number', strictTypes: false, allowUnionTypes: true, allErrors: true });
ajvFormats(ajv);
ajvErrors(ajv);

// Custom env vars
const JWT_AUTHORIZER_SECRET = process.env.JWT_AUTHORIZER_SECRET;

export const handler = middy(async (event, context) => {
    const token = event.headers.Authorization;
    const { llmDataSourceId: aiDataSourceId } = event.queryStringParameters; // LLM renamed to AI

    // Get data source
    const aiDataSourceService = new AiDataSourceService(context.jwtAuth.anonKey, token);
    const aiDataSource = await aiDataSourceService.get(aiDataSourceId);
    console.log('aiDataSource:', aiDataSource);
    if (!aiDataSource) {
        return {};
    }

    // Keep Bedrock KB if it was imported
    if (!aiDataSource.isImported) {
        // Check if Bedrock KB is imported to another data source
        const isImported = await aiDataSourceService.isImported(aiDataSource.knowledgeBaseId);
        console.log('isImported:', isImported);
        if (isImported) {
            // Build error
            const responseError = new Error();
            responseError.response = {
                data: {
                    message: 'Knowledge Base is imported to another data source',
                },
                status: 409,
                statusText: 'Knowledge Base is imported to another data source',
            };
            throw responseError;
        }

        // Delete knowledge base
        if (aiDataSource.knowledgeBaseId) {
            const awsBedrockService = new AwsBedrockService();
            await awsBedrockService.deleteKnowledgeBase({
                knowledgeBaseId: aiDataSource.knowledgeBaseId,
            });
        }

        // Delete collection and all related policies
        if (aiDataSource.collectionId) {
            const awsAossService = new AwsAossService();
            await awsAossService.deleteCollection({
                aiDataSourceId,
                collectionId: aiDataSource.collectionId,
            });
        }

        // Delete vector bucket
        if (aiDataSource.vectorBucketName) {
            const awsS3vectorsService = new AwsS3vectorsService();
            await awsS3vectorsService.deleteVectorBucket({
                vectorBucketName: aiDataSource.vectorBucketName,
            });
        }
    }

    // Delete from DB
    await aiDataSourceService.delete(aiDataSourceId);

    return {};
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
