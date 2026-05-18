import axios from 'axios';

export default class LlmTaskDb {
    #apiUrl;
    #apiKey;
    #token;

    constructor(apiUrl, apiKey, token) {
        this.#apiUrl = apiUrl;
        this.#apiKey = apiKey;
        this.#token = token;
    }

    async createOrUpdate(data) {
        console.log('LlmTaskDb -> createOrUpdate -> data:', data);
        const body = {
            llm_task_id: data.llmTaskId,
            name: data.name,
            type: data.type,
            order: data.order,
            input: data.input,
            assistant_appendix: data.assistantAppendix,
            preamble: data.preamble,
            llm_structure_id: data.llmStructureId,
            user_id: data.userId,
            account_id: data.accountId,
        };
        console.log('LlmTaskDb -> createOrUpdate -> body:', body);
        await axios.post(`${this.#apiUrl}/rest/v1/llm_task`, body, {
            headers: {
                Authorization: this.#token,
                apikey: this.#apiKey,
                Prefer: 'resolution=merge-duplicates', // enable UPSERT (INSERT or UPDATE) behaviour
            },
        });
    }
}
