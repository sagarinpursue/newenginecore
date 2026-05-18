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

    async get(llmStructureId) {
        console.log('LlmStructureDb -> get -> llmStructureId:', llmStructureId);
        const { data } = await axios.get(`${this.#apiUrl}/rest/v1/rpc/llm_structure_all_tasks_get`, {
            headers: {
                Authorization: this.#token,
                apikey: this.#apiKey,
            },
            params: {
                structure_id: llmStructureId,
            },
        });
        return data;
    }
}
