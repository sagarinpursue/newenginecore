import axios from 'axios';

export default class LlmPromptDriverDb {
    #apiUrl;
    #apiKey;
    #token;

    constructor(apiUrl, apiKey, token) {
        this.#apiUrl = apiUrl;
        this.#apiKey = apiKey;
        this.#token = token;
    }

    async createOrUpdate(data) {
        console.log('LlmPromptDriverDb -> createOrUpdate -> data:', data);
        const body = {
            llm_prompt_driver_id: data.llmPromptDriverId,
            name: data.name,
            type: data.type,
            model: data.model,
            top_p: data.topP,
            temperature: data.temperature,
            user_id: data.userId,
            account_id: data.accountId,
            llm_task_id: data.llmTaskId,
        };
        console.log('LlmPromptDriverDb -> createOrUpdate -> body:', body);
        await axios.post(`${this.#apiUrl}/rest/v1/llm_prompt_driver`, body, {
            headers: {
                Authorization: this.#token,
                apikey: this.#apiKey,
                Prefer: 'resolution=merge-duplicates', // enable UPSERT (INSERT or UPDATE) behaviour
            },
        });
    }
}
