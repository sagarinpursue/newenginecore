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

    async get(structureId) {
        console.log('LlmStructureDb -> get -> structureId:', structureId);
        const { data } = await axios.get(`${this.#apiUrl}/rest/v1/llm_structure`, {
            headers: {
                Authorization: this.#token,
                apikey: this.#apiKey,
            },
            params: {
                llm_structure_id: `eq.${structureId}`,
            },
        });
        return data[0];
    }
}
