import axios from 'axios';

export default class ChatMessageDbApi {
    #apiUrl;
    #apiKey;
    #token;

    constructor(apiUrl, apiKey, token) {
        this.#apiUrl = apiUrl;
        this.#apiKey = apiKey;
        this.#token = token;
    }

    async saveMessage(message) {
        const body = {
            content: message.content,
            source: message.source,
            message_type: message.messageType,
            session_id: message.sessionId,
            chat_message_id: message.messageId,
            sources: message.sources,
            vendor_message_id: message.vendorMessageId,
        };

        const { data } = await axios.post(`${this.#apiUrl}/rest/v1/chat_messages`, body, {
            headers: {
                Authorization: this.#token,
                apikey: this.#apiKey,
                Prefer: 'return=representation',
            },
        });

        return data[0];
    }

    async setAnsweredAt(answeredAtTimestamp, chatMessageId) {
        const body = {
            answered_at: answeredAtTimestamp,
        };

        await axios.patch(`${this.#apiUrl}/rest/v1/chat_messages`, body, {
            params: {
                chat_message_id: `eq.${chatMessageId}`,
            },
            headers: {
                Authorization: this.#token,
                apikey: this.#apiKey,
            },
        });
    }

    async setVendorMessageId(vendorMessageId, chatMessageId) {
        const body = {
            vendor_message_id: vendorMessageId,
        };

        await axios.patch(`${this.#apiUrl}/rest/v1/chat_messages`, body, {
            params: {
                chat_message_id: `eq.${chatMessageId}`,
            },
            headers: {
                Authorization: this.#token,
                apikey: this.#apiKey,
            },
        });
    }

    async getMessagesBySessionId(sessionId) {
        const { data } = await axios.get(`${this.#apiUrl}/rest/v1/chat_messages`, {
            params: {
                session_id: `eq.${sessionId}`,
                order: 'created_at.asc',
                select: 'content,source',
            },
            headers: {
                Authorization: this.#token,
                apikey: this.#apiKey,
            },
        });

        return data;
    }

    async getMessageByVendorMessageId(vendorMessageId) {
        const { data } = await axios.get(`${this.#apiUrl}/rest/v1/chat_messages`, {
            params: {
                source: `eq.ai-agent`,
                vendor_message_id: `eq.${vendorMessageId}`,
            },
            headers: {
                Authorization: this.#token,
                apikey: this.#apiKey,
            },
        });

        if (data.length > 1) {
            console.error('>>>>> Many messages detected');
        }

        return data[0];
    }

    async saveRating(messageId, ratingType) {
        const body = {
            chat_message_id: messageId,
            rating: ratingType,
        };

        await axios.post(`${this.#apiUrl}/rest/v1/chat_message_ratings`, body, {
            params: {
                on_conflict: 'chat_message_id',
            },
            headers: {
                Authorization: this.#token,
                apikey: this.#apiKey,
                Prefer: 'resolution=merge-duplicates',
            },
        });
    }

    async removeRating(messageId) {
        await axios.delete(`${this.#apiUrl}/rest/v1/chat_message_ratings`, {
            params: {
                chat_message_id: `eq.${messageId}`,
            },
            headers: {
                Authorization: this.#token,
                apikey: this.#apiKey,
            },
        });
    }

    async saveFeedback(messageId, feedbackReason, feedbackText) {
        const body = {
            chat_message_id: messageId,
            feedback_reason: feedbackReason,
            feedback_text: feedbackText,
        };

        await axios.post(`${this.#apiUrl}/rest/v1/chat_message_feedbacks`, body, {
            headers: {
                Authorization: this.#token,
                apikey: this.#apiKey,
            },
        });
    }

    async removeFeedback(messageId) {
        await axios.delete(`${this.#apiUrl}/rest/v1/chat_message_feedbacks`, {
            params: {
                chat_message_id: `eq.${messageId}`,
            },
            headers: {
                Authorization: this.#token,
                apikey: this.#apiKey,
            },
        });
    }
}
