// Native and 3rd party Node modules
import { randomUUID } from 'crypto';

// Custom Node modules
import { AwsBedrockClient, AwsLambdaClient } from '@shared-modules/f2-clients';
import { LlmDataSourceDbApi } from '@shared-modules/f2-db-api';

// Custom env vars
const DB_API_URL = process.env.DB_API_URL;
const AI_DATA_SOURCE_CREATOR_LAMBDA_NAME = process.env.AI_DATA_SOURCE_CREATOR_LAMBDA_NAME;
const LLM_DATA_SOURCES_FOLDER = process.env.LLM_DATA_SOURCES_FOLDER;

const awsLambdaClient = new AwsLambdaClient();
const awsBedrockClient = new AwsBedrockClient();

export const createNew = async ({ dbApiKey, token, data }) => {
    const llmDataSourceDbApi = new LlmDataSourceDbApi(DB_API_URL, dbApiKey, token);

    const aiDataSourceId = randomUUID();

    await llmDataSourceDbApi.create({
        llmDataSourceId: aiDataSourceId,

        name: data.name,

        chunkingStrategy: data.chunkingStrategy,
        chunkSize: data.chunkSize,
        embeddingModels: data.embeddingModels,
        sourceType: data.sourceType,

        s3Folder: data.s3Folder,

        url: data.url,
        destinationType: data.destinationType,

        userId: data.userId,
        accountId: data.accountId,
    });

    await awsLambdaClient.invokeEvent({
        name: AI_DATA_SOURCE_CREATOR_LAMBDA_NAME,
        payload: {
            aiDataSourceId: aiDataSourceId,
        },
    });

    return {
        id: aiDataSourceId,
    };
};

export const importExisting = async ({ dbApiKey, token, data }) => {
    const { name, knowledgeBaseId, userId, accountId } = data;
    const knowledgeBase = await awsBedrockClient.getKnowledgeBase({ knowledgeBaseId });

    const llmDataSourceDbApi = new LlmDataSourceDbApi(DB_API_URL, dbApiKey, token);

    const aiDataSourceId = randomUUID();

    await llmDataSourceDbApi.create({
        llmDataSourceId: aiDataSourceId,

        name,

        chunkingStrategy: knowledgeBase.chunkingStrategy,
        chunkSize: knowledgeBase.chunkSize,
        embeddingModels: knowledgeBase.embeddingsModel,
        sourceType: knowledgeBase.sourceType,

        // s3Folder is returned like 'llm-data-sources/default/', need to return 'default' only
        s3Folder: knowledgeBase.s3Folder
            ?.split(LLM_DATA_SOURCES_FOLDER)
            ?.pop() // remove 'llm-data-sources' (if presented)
            ?.replace(/^\/|\/$/g, ''), // remove 1st and last slashes (if presented)

        url: knowledgeBase.url,
        destinationType: knowledgeBase.destinationType,

        knowledgeBaseId: knowledgeBaseId,
        dataSourceId: knowledgeBase.dataSourceId,
        collectionId: knowledgeBase.collectionId,
        vectorBucketName: knowledgeBase.vectorBucketName,

        status: 'ACTIVE',
        isImported: true,

        userId,
        accountId,
    });

    return {
        id: aiDataSourceId,
    };
};
