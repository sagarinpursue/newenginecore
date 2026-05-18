import axios from 'axios';

export default class LlmStructureDb {
    #apiUrl;
    #apiKey;
    #token;

    constructor(apiUrl, apiKey, token) {
        this.#apiUrl = apiUrl;
        this.#apiKey = apiKey;
        this.#token = token;
    }

    async createOrUpdate(data) {
        console.log('LlmStructureDb -> createOrUpdate -> data:', data);
        const body = {
            llm_structure_id: data.llmStructureId,
            name: data.name,
            type: data.type,
            framework: data.framework,
            memory: data.memory,
            memory_size: data.memorySize,
            memory_driver: data.memoryDriver,
            user_id: data.userId,
            account_id: data.accountId,
        };
        console.log('LlmStructureDb -> createOrUpdate -> body:', body);
        await axios.post(`${this.#apiUrl}/rest/v1/llm_structure`, body, {
            headers: {
                Authorization: this.#token,
                apikey: this.#apiKey,
                Prefer: 'resolution=merge-duplicates', // enable UPSERT (INSERT or UPDATE) behaviour
            },
        });
    }
}
