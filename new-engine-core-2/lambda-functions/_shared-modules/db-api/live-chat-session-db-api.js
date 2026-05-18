import axios from 'axios';

export default class LiveChatSessionDbApi {
    #apiUrl;
    #apiKey;

    constructor(apiUrl, apiKey) {
        this.#apiUrl = apiUrl;
        this.#apiKey = apiKey;
    }

    async getChatBySessionId(sessionId) {
        const { data } = await axios.get(`${this.#apiUrl}/rest/v1/live_chat_sessions`, {
            params: {
                session_id: `eq.${sessionId}`,
            },
            headers: {
                apikey: this.#apiKey,
            },
        });

        return data[0];
    }

    async getSessionByChatId(chatId) {
        const { data } = await axios.get(`${this.#apiUrl}/rest/v1/live_chat_sessions`, {
            params: {
                chat_id: `eq.${chatId}`,
            },
            headers: {
                apikey: this.#apiKey,
            },
        });

        return data[0];
    }

    async updateActivityFlag(chatId, flag) {
        const body = {
            is_active: flag,
        };

        await axios.patch(`${this.#apiUrl}/rest/v1/live_chat_sessions`, body, {
            params: {
                chat_id: `eq.${chatId}`,
            },
            headers: {
                apikey: this.#apiKey,
            },
        });
    }

    async updateClientToken(chatId, data) {
        const body = {
            customer_access_token: data.access_token,
            expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString(),
        };

        await axios.patch(`${this.#apiUrl}/rest/v1/live_chat_sessions`, body, {
            params: {
                chat_id: `eq.${chatId}`,
            },
            headers: {
                apikey: this.#apiKey,
            },
        });
    }

    async createLiveChatConnection(data) {
        const body = {
            chat_id: data.chatId,
            session_id: data.sessionId,
            organisation_id: data.organisationId,
            customer_access_token: data.customerAccessToken,
            entity_id: data.entityId,
            expires_at: new Date(Date.now() + data.expiresIn * 1000).toISOString(),
            is_active: data.isActive,
            email: data.email,
            full_name: data.fullName,
            phone_number: data.phoneNumber,
        };

        await axios.post(`${this.#apiUrl}/rest/v1/live_chat_sessions`, body, {
            headers: {
                apikey: this.#apiKey,
            },
        });
    }
}
