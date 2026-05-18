import axios from 'axios';

export default class LlmStructureSharedTokenDb {
    #apiUrl;
    #apiKey;
    #token;

    constructor(apiUrl, apiKey, token) {
        this.#apiUrl = apiUrl;
        this.#apiKey = apiKey;
        this.#token = token;
    }

    async create(data) {
        console.log('LlmStructureSharedTokenDb -> create -> data:', data);
        const body = {
            llm_structure_shared_token_id: data.llmStructureSharedTokenId,
            llm_structure_id: data.llmStructureId,
            shared_token: data.sharedToken,
        };
        console.log('LlmStructureSharedTokenDb -> create -> body:', body);
        await axios.post(`${this.#apiUrl}/rest/v1/llm_structure_shared_token`, body, {
            headers: {
                Authorization: this.#token,
                apikey: this.#apiKey,
                Prefer: 'resolution=ignore-duplicates', // Don't update shared token on LLM structure update
            },
        });
    }
}
