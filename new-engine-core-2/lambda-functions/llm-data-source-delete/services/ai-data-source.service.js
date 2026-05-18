// Custom Node modules
import { LlmDataSourceDbApi } from '@shared-modules/f2-db-api';

// Custom env vars
const DB_API_URL = process.env.DB_API_URL;

export default class AiDataSourceService {
    #dbApi;

    constructor(dbApiKey, token) {
        this.#dbApi = new LlmDataSourceDbApi(DB_API_URL, dbApiKey, token);
    }

    async get(aiDataSourceId) {
        const aiDataSource = await this.#dbApi.get(aiDataSourceId);
        return aiDataSource
            ? {
                  aiDataSourceId: aiDataSource.llmDataSourceId,
                  name: aiDataSource.name,

                  chunkingStrategy: aiDataSource.chunkingStrategy,
                  chunkSize: aiDataSource.chunkSize,
                  embeddingsModel: aiDataSource.embeddingsModel,

                  sourceType: aiDataSource.sourceType,
                  s3Folder: aiDataSource.s3Folder,
                  url: aiDataSource.url,
                  destinationType: aiDataSource.destinationType,

                  knowledgeBaseId: aiDataSource.knowledgeBaseId,
                  dataSourceId: aiDataSource.dataSourceId,
                  ingestionJobId: aiDataSource.ingestionJobId,
                  collectionId: aiDataSource.collectionId,
                  vectorBucketName: aiDataSource.vectorBucketName,

                  status: aiDataSource.status,
                  isImported: aiDataSource.isImported,
              }
            : null;
    }

    async isImported(knowledgeBaseId) {
        return this.#dbApi.isImported(knowledgeBaseId);
    }

    async delete(aiDataSourceId) {
        await this.#dbApi.delete(aiDataSourceId);
    }
}
