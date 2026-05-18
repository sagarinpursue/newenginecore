import axios from 'axios';

export default class LiveChatThreadDbApi {
    #apiUrl;
    #apiKey;

    constructor(apiUrl, apiKey) {
        this.#apiUrl = apiUrl;
        this.#apiKey = apiKey;
    }

    async createLiveChatThread(data) {
        const body = {
            chat_id: data.chatId,
            thread_id: data.threadId,
            session_id: data.sessionId,
        };

        await axios.post(`${this.#apiUrl}/rest/v1/live_chat_threads`, body, {
            headers: {
                apikey: this.#apiKey,
            },
        });
    }
}
