import axios from 'axios';

export default class Cx360DialogStatusDbApi {
    #apiUrl;
    #apiKey;
    #token;

    constructor(apiUrl, apiKey, token) {
        this.#apiUrl = apiUrl;
        this.#apiKey = apiKey;
        this.#token = token;
    }

    async addStatus(data) {
        const body = {
            channel_id: data.channelId,
            account_id: data.accountId,
            message_id: data.messageId,
            status: data.status,
            timestamp: data.timestamp,
            type: data.type,
            recipient_name: data.recipientName,
            recipient_id: data.recipientId,
            recipient_user_id: data.recipientUserId,
            details: data.details,
        };

        await axios.post(`${this.#apiUrl}/rest/v1/cx_360dialog_statuses`, body, {
            headers: {
                Authorization: this.#token,
                apikey: this.#apiKey,
            },
        });
    }
}
