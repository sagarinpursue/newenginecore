// Native and 3rd party Node modules
import { CollectionStatus } from '@aws-sdk/client-opensearchserverless';

import middy from '@middy/core';
import inputOutputLogger from '@middy/input-output-logger';
import secretsManager from '@middy/secrets-manager';
import validator from '@middy/validator';

import Ajv from 'ajv';
import ajvErrors from 'ajv-errors';
import ajvFormats from 'ajv-formats';

// Custom Node modules
import { eventSchema } from './schemas/event.js';
import AiDataSourceService from './services/ai-data-source.service.js';
import AwsAossService from './services/aws-aoss.service.js';
import AwsBedrockService from './services/aws-bedrock.service.js';
import AwsS3vectorsService from './services/aws-s3vectors.service.js';

// Custom env vars
const JWT_AUTHORIZER_SECRET = process.env.JWT_AUTHORIZER_SECRET;

// Create AJV instance and configure it with ajv-errors and ajv-formats
const ajv = new Ajv({ coerceTypes: 'number', strictTypes: false, allowUnionTypes: true, allErrors: true });
ajvFormats(ajv);
ajvErrors(ajv);

export const handler = middy(async (event, context) => {
    const { aiDataSourceId } = event;

    // Get data source
    const aiDataSourceService = new AiDataSourceService(context.jwtAuth.serviceRoleKey);
    const aiDataSource = await aiDataSourceService.get(aiDataSourceId);
    console.log('aiDataSource:', aiDataSource);

    if (aiDataSource.status === CollectionStatus.ACTIVE) {
        // Already created
        console.log('Already created');
        return;
    }

    try {
        // Create collection
        const awsAossService = new AwsAossService();
        const {
            id: collectionId,
            arn: collectionArn,
            indexName: collectionIndexName,
        } = aiDataSource.destinationType === 'OpenSearch'
            ? await awsAossService.createCollection({
                  aiDataSourceId,
                  aiDataSourceName: aiDataSource.name,
                  embeddingsModel: aiDataSource.embeddingsModel,
              })
            : {};
        console.log('collectionId:', collectionId);
        console.log('collectionArn:', collectionArn);
        console.log('collectionIndexName:', collectionIndexName);

        // Create vector bucket
        const awsS3vectorsService = new AwsS3vectorsService();
        const {
            arn: vectorBucketArn,
            name: vectorBucketName,
            indexArn: vectorBucketIndexArn,
            indexName: vectorBucketIndexName,
        } = aiDataSource.destinationType === 'S3'
            ? await awsS3vectorsService.createVectorBucket({
                  aiDataSourceName: aiDataSource.name,
                  embeddingsModel: aiDataSource.embeddingsModel,
              })
            : {};
        console.log('vectorBucketArn:', vectorBucketArn);
        console.log('vectorBucketName:', vectorBucketName);
        console.log('vectorBucketIndexArn:', vectorBucketIndexArn);
        console.log('vectorBucketIndexName:', vectorBucketIndexName);

        // Create knowledge base + 1 data source
        const awsBedrockService = new AwsBedrockService();
        const { knowledgeBaseId, dataSourceId } = await awsBedrockService.createKnowledgeBase({
            aiDataSourceId,
            aiDataSourceName: aiDataSource.name,
            embeddingsModel: aiDataSource.embeddingsModel,
            collectionArn,
            vectorBucketArn,
            indexArn: vectorBucketIndexArn,
            indexName: collectionIndexName || vectorBucketIndexName,
            dataSourceType: aiDataSource.sourceType,
            s3Folder: aiDataSource.s3Folder,
            webUrl: aiDataSource.url,
            chunkingStrategy: aiDataSource.chunkingStrategy,
            chunkSize: aiDataSource.chunkSize,
        });
        console.log('knowledgeBaseId:', knowledgeBaseId);
        console.log('dataSourceId:', dataSourceId);

        // update DB (knowledge base ID, data source ID, status = ACTIVE)
        await aiDataSourceService.update(aiDataSourceId, {
            knowledgeBaseId,
            dataSourceId,
            collectionId,
            vectorBucketName,
            status: CollectionStatus.ACTIVE,
        });
    } catch (error) {
        console.error('error:', error);

        // Error happened - set status = FAILED
        await aiDataSourceService.update(aiDataSourceId, {
            status: CollectionStatus.FAILED,
        });
    }
}).use([
    inputOutputLogger(),
    secretsManager({
        fetchData: {
            jwtAuth: JWT_AUTHORIZER_SECRET,
        },
        disablePrefetch: true,
        setToContext: true,
    }),
    validator({ eventSchema: ajv.compile(eventSchema) }),
]);
