import axios from 'axios';

export default class LlmDataSourceDbApi {
    #apiUrl;
    #apiKey;
    #token;

    constructor(apiUrl, apiKey, token) {
        this.#apiUrl = apiUrl;
        this.#apiKey = apiKey;
        this.#token = token;
    }

    async create(data) {
        console.log('LlmDataSourceDbApi -> create -> data:', data);
        const body = {
            llm_data_source_id: data.llmDataSourceId,
            name: data.name,

            chunking_strategy: data.chunkingStrategy,
            chunk_size: data.chunkSize,
            embeddings_model: data.embeddingModels,
            source_type: data.sourceType,
            s3_folder: data.s3Folder,
            url: data.url,
            destination_type: data.destinationType,

            knowledge_base_id: data.knowledgeBaseId,
            data_source_id: data.dataSourceId,
            ingestion_job_id: data.ingestionJobId,
            collection_id: data.collectionId,
            vector_bucket_name: data.vectorBucketName,

            status: data.status,
            is_imported: data.isImported,

            user_id: data.userId,
            account_id: data.accountId,
        };
        console.log('LlmDataSourceDbApi -> create -> body:', body);
        await axios.post(`${this.#apiUrl}/rest/v1/llm_data_sources`, body, {
            headers: {
                Authorization: this.#token,
                apikey: this.#apiKey,
            },
        });
    }

    async update(llmDataSourceId, data) {
        console.log('LlmDataSourceDbApi -> update -> data:', data);
        const body = {
            knowledge_base_id: data.knowledgeBaseId,
            data_source_id: data.dataSourceId,
            collection_id: data.collectionId,
            vector_bucket_name: data.vectorBucketName,

            status: data.status,
        };
        console.log('LlmDataSourceDbApi -> update -> body:', body);
        await axios.patch(`${this.#apiUrl}/rest/v1/llm_data_sources`, body, {
            params: {
                llm_data_source_id: `eq.${llmDataSourceId}`,
            },
            headers: {
                Authorization: this.#token,
                apikey: this.#apiKey,
            },
        });
    }

    async get(dataSourceId) {
        console.log('LlmDataSourceDbApi -> get -> dataSourceId:', dataSourceId);
        const { data } = await axios.get(`${this.#apiUrl}/rest/v1/llm_data_sources`, {
            params: {
                llm_data_source_id: `eq.${dataSourceId}`,
            },
            headers: {
                Authorization: this.#token,
                apikey: this.#apiKey,
            },
        });
        return data[0]
            ? {
                  llmDataSourceId: data[0].llm_data_source_id,
                  name: data[0].name,

                  chunkingStrategy: data[0].chunking_strategy,
                  chunkSize: data[0].chunk_size,
                  embeddingsModel: data[0].embeddings_model,
                  sourceType: data[0].source_type,
                  s3Folder: data[0].s3_folder,
                  url: data[0].url,
                  destinationType: data[0].destination_type,

                  knowledgeBaseId: data[0].knowledge_base_id,
                  dataSourceId: data[0].data_source_id,
                  ingestionJobId: data[0].ingestion_job_id,
                  collectionId: data[0].collection_id,
                  vectorBucketName: data[0].vector_bucket_name,

                  status: data[0].status,
                  isImported: data[0].is_imported,
              }
            : null;
    }

    async isImported(knowledgeBaseId) {
        console.log('LlmDataSourceDbApi -> isImported -> knowledgeBaseId:', knowledgeBaseId);
        const response = await axios.head(`${this.#apiUrl}/rest/v1/llm_data_sources`, {
            params: {
                knowledge_base_id: `eq.${knowledgeBaseId}`,
                is_imported: `is.true`,
            },
            headers: {
                Authorization: this.#token,
                apikey: this.#apiKey,
                Prefer: 'count=exact',
            },
        });
        const contentRange = response.headers['content-range'];
        // PostgREST returns '*/0' when no records match, or '0-0/N' when records exist
        const count = contentRange ? parseInt(contentRange.split('/')[1]) : 0;
        return count > 0;
    }

    async delete(dataSourceId) {
        console.log('LlmDataSourceDbApi -> delete -> dataSourceId:', dataSourceId);
        await axios.delete(`${this.#apiUrl}/rest/v1/llm_data_sources`, {
            params: {
                llm_data_source_id: `eq.${dataSourceId}`,
            },
            headers: {
                Authorization: this.#token,
                apikey: this.#apiKey,
            },
        });
    }
}
