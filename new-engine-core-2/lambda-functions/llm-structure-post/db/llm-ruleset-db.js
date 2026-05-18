import axios from 'axios';

export default class LlmRulesetDb {
    #apiUrl;
    #apiKey;
    #token;

    constructor(apiUrl, apiKey, token) {
        this.#apiUrl = apiUrl;
        this.#apiKey = apiKey;
        this.#token = token;
    }

    async createOrUpdate(data) {
        console.log('LlmRulesetDb -> createOrUpdate -> data:', data);
        const body = {
            llm_ruleset_id: data.llmRulesetId,
            name: data.name,
            user_id: data.userId,
            account_id: data.accountId,
            llm_task_id: data.llmTaskId,
        };
        console.log('LlmRulesetDb -> createOrUpdate -> body:', body);
        await axios.post(`${this.#apiUrl}/rest/v1/llm_ruleset`, body, {
            headers: {
                Authorization: this.#token,
                apikey: this.#apiKey,
                Prefer: 'resolution=merge-duplicates', // enable UPSERT (INSERT or UPDATE) behaviour
            },
        });
    }
}
