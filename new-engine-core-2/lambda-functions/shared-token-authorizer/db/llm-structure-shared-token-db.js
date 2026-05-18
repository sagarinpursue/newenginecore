import axios from 'axios';

export default class LlmStructureSharedTokenDb {
    #apiUrl;
    #apiKey;

    constructor(apiUrl, apiKey) {
        this.#apiUrl = apiUrl;
        this.#apiKey = apiKey;
    }

    async getLlmStructureId(token) {
        console.log('LlmStructureSharedTokenDb -> get -> token:', token);
        const { data } = await axios.get(`${this.#apiUrl}/rest/v1/llm_structure_shared_token`, {
            headers: {
                apikey: this.#apiKey,
                Authorization: `Bearer ${this.#apiKey}`, // Put API key to Authorization
            },
            params: {
                shared_token: `eq.${token}`,
            },
        });
        return data?.[0]?.llm_structure_id;
    }
}
