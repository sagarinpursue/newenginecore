import axios from 'axios';

export default class LiveChatInstanceDbApi {
    #apiUrl;
    #apiKey;

    constructor(apiUrl, apiKey) {
        this.#apiUrl = apiUrl;
        this.#apiKey = apiKey;
    }

    async getInstanceById(clientId) {
        const { data } = await axios.get(`${this.#apiUrl}/rest/v1/live_chat_instances`, {
            params: {
                client_id: `eq.${clientId}`,
            },
            headers: {
                apikey: this.#apiKey,
            },
        });

        return data[0];
    }
}
