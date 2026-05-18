import { AwsBedrockClient } from '@shared-modules/f2-clients';

// Custom env vars
const APP_NAME = process.env.APP_NAME;
const ENV = process.env.ENV;
const BEDROCK_KNOWLEDGE_BASE_ROLE_ARN = process.env.BEDROCK_KNOWLEDGE_BASE_ROLE_ARN;
const BUCKET_ARN = process.env.BUCKET_ARN;
const LLM_DATA_SOURCES_FOLDER = process.env.LLM_DATA_SOURCES_FOLDER;

export default class AwsBedrockService {
    #client;

    constructor() {
        this.#client = new AwsBedrockClient();
    }

    async createKnowledgeBase(options) {
        const {
            aiDataSourceId,
            aiDataSourceName,
            embeddingsModel,
            collectionArn,
            vectorBucketArn,
            indexArn,
            indexName,
            dataSourceType,
            s3Folder,
            webUrl,
            chunkingStrategy,
            chunkSize,
        } = options;

        const knowledgeBase = await this.#client.createKnowledgeBase({
            name: `${APP_NAME}-${aiDataSourceId}-${ENV}`,
            description: `[${APP_NAME} ${ENV}] Knowledge Base for ${aiDataSourceName} data source`,
            roleArn: BEDROCK_KNOWLEDGE_BASE_ROLE_ARN,
            embeddingsModel,
            collectionArn,
            vectorBucketArn,
            indexArn,
            indexName,
        });

        const dataSource = await this.#client.addDataSourceToKnowledgeBase({
            name: `${APP_NAME}-${aiDataSourceId}-${ENV}`,
            knowledgeBaseId: knowledgeBase.id,
            dataSourceType,
            s3Bucket: BUCKET_ARN,
            s3Prefix: `${LLM_DATA_SOURCES_FOLDER}/${s3Folder}/`,
            webUrl,
            chunkingStrategy,
            chunkSize: chunkSize || 300,
        });

        return {
            knowledgeBaseId: knowledgeBase.id,
            dataSourceId: dataSource.id,
        };
    }
}
