// Custom Node modules
import { LlmDataSourceDbApi } from '@shared-modules/f2-db-api';

// Custom env vars
const DB_API_URL = process.env.DB_API_URL;
export default class AiDataSourceService {
    #dbApi;

    constructor(dbApiKey) {
        this.#dbApi = new LlmDataSourceDbApi(DB_API_URL, dbApiKey, `Bearer ${dbApiKey}`);
    }

    async get(aiDataSourceId) {
        const aiDataSource = await this.#dbApi.get(aiDataSourceId);
        return {
            aiDataSourceId: aiDataSource.llmDataSourceId,
            name: aiDataSource.name,

            chunkingStrategy: aiDataSource.chunkingStrategy,
            chunkSize: aiDataSource.chunkSize,
            embeddingsModel: aiDataSource.embeddingsModel,

            knowledgeBaseId: aiDataSource.knowledgeBaseId,
            dataSourceId: aiDataSource.dataSourceId,
            ingestionJobId: aiDataSource.ingestionJobId,
            collectionId: aiDataSource.collectionId,
            vectorBucketName: aiDataSource.vectorBucketName,

            sourceType: aiDataSource.sourceType,
            s3Folder: aiDataSource.s3Folder,
            url: aiDataSource.url,
            destinationType: aiDataSource.destinationType,

            status: aiDataSource.status,
            isImported: aiDataSource.isImported,
        };
    }

    async update(aiDataSourceId, options) {
        await this.#dbApi.update(aiDataSourceId, options);
    }
}
