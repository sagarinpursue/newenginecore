import axios from 'axios';

export default class ChatbotSessionDb {
    #apiUrl;
    #apiKey;

    constructor(apiUrl, apiKey) {
        this.#apiUrl = apiUrl;
        this.#apiKey = apiKey;
    }

    async updateConnectionToken(sessionId, token) {
        const body = {
            connection_token: token,
        };

        await axios.patch(`${this.#apiUrl}/rest/v1/chatbot_sessions`, body, {
            params: {
                session_id: `eq.${sessionId}`,
            },
            headers: {
                apikey: this.#apiKey,
            },
        });
    }

    async getSessionById(sessionId) {
        const { data } = await axios.get(`${this.#apiUrl}/rest/v1/chatbot_sessions`, {
            params: {
                session_id: `eq.${sessionId}`,
            },
            headers: {
                apikey: this.#apiKey,
            },
        });

        return data[0];
    }
}
