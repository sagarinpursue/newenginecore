import axios from 'axios';

export default class LlmQueryEngineDb {
    #apiUrl;
    #apiKey;
    #token;

    constructor(apiUrl, apiKey, token) {
        this.#apiUrl = apiUrl;
        this.#apiKey = apiKey;
        this.#token = token;
    }

    async createOrUpdate(data) {
        console.log('LlmQueryEngineDb -> createOrUpdate -> data:', data);
        const body = {
            llm_query_engine_id: data.llmQueryEngineId,
            name: data.name,
            use_hybrid_search: data.useHybridSearch,
            use_rag_api: data.useRagApi,
            embedding_driver: data.embeddingDriver,
            namespace: data.namespace,
            top_n: data.topN,
            vector_store_driver: data.vectorStoreDriver,
            user_id: data.userId,
            account_id: data.accountId,
            llm_task_id: data.llmTaskId,
        };
        console.log('LlmQueryEngineDb -> createOrUpdate -> body:', body);
        await axios.post(`${this.#apiUrl}/rest/v1/llm_query_engine`, body, {
            headers: {
                Authorization: this.#token,
                apikey: this.#apiKey,
                Prefer: 'resolution=merge-duplicates', // enable UPSERT (INSERT or UPDATE) behaviour
            },
        });
    }
}
