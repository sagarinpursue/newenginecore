import axios from 'axios';

export default class ChatbotSessionDbApi {
    #apiUrl;
    #apiKey;
    #token;

    constructor(apiUrl, apiKey, token) {
        this.#apiUrl = apiUrl;
        this.#apiKey = apiKey;
        this.#token = token;
    }

    async createSession(payload) {
        const body = {
            chat_id: payload.chatId,
            session_id: payload.sessionId,
            channel_id: payload.channelId,
            account_id: payload.accountId,
            vendor_type: payload.vendorType,
            vendor_client_id: payload.vendorClientId,
        };

        const { data } = await axios.post(`${this.#apiUrl}/rest/v1/chatbot_sessions`, body, {
            headers: {
                Authorization: this.#token,
                apikey: this.#apiKey,
                Prefer: 'return=representation',
            },
        });

        return data[0];
    }

    async updateLastActivity(lastActivityTimestamp, sessionId) {
        await axios.patch(
            `${this.#apiUrl}/rest/v1/chatbot_sessions`,
            {
                last_activity: lastActivityTimestamp,
            },
            {
                params: {
                    session_id: `eq.${sessionId}`,
                },
                headers: {
                    Authorization: this.#token,
                    apikey: this.#apiKey,
                },
            }
        );
    }

    async getSessionById(sessionId) {
        const { data } = await axios.get(`${this.#apiUrl}/rest/v1/chatbot_sessions`, {
            params: {
                session_id: `eq.${sessionId}`,
            },
            headers: {
                Authorization: this.#token,
                apikey: this.#apiKey,
            },
        });

        return data[0];
    }

    async getActiveSessionByVendorClientId(channelId, clientId, timeout) {
        const timeAgo = new Date(Date.now() - timeout * 60 * 1000).toISOString();

        const { data } = await axios.get(`${this.#apiUrl}/rest/v1/chatbot_sessions`, {
            params: {
                channel_id: `eq.${channelId}`,
                vendor_client_id: `eq.${clientId}`,
                last_activity: `gt.${timeAgo}`,
            },
            headers: {
                Authorization: this.#token,
                apikey: this.#apiKey,
            },
        });

        if (data.length > 1) {
            console.error('>>>>> Many active sessions detected');
        }

        return data[0];
    }

    async updateConnectionFlag(sessionId, flag) {
        const body = {
            is_live_agent_connected: flag,
        };

        await axios.patch(`${this.#apiUrl}/rest/v1/chatbot_sessions`, body, {
            params: {
                session_id: `eq.${sessionId}`,
            },
            headers: {
                Authorization: this.#token,
                apikey: this.#apiKey,
            },
        });
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
                Authorization: this.#token,
                apikey: this.#apiKey,
            },
        });
    }

    async markSessionAsEscalatedToLiveAgent(sessionId) {
        const body = {
            was_escalated_to_live_agent: true,
        };

        await axios.patch(`${this.#apiUrl}/rest/v1/chatbot_sessions`, body, {
            params: {
                session_id: `eq.${sessionId}`,
            },
            headers: {
                Authorization: this.#token,
                apikey: this.#apiKey,
            },
        });
    }
}
