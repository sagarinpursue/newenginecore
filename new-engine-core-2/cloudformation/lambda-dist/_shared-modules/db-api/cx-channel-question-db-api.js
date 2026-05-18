import axios from 'axios';

export default class CxChannelQuestionDbApi {
    #apiUrl;
    #apiKey;
    #token;

    constructor(apiUrl, apiKey, token) {
        this.#apiUrl = apiUrl;
        this.#apiKey = apiKey;
        this.#token = token;
    }

    async getActiveQuestions(channelId) {
        const { data } = await axios.get(`${this.#apiUrl}/rest/v1/cx_channel_questions`, {
            headers: {
                Authorization: this.#token,
                apikey: this.#apiKey,
            },
            params: {
                select: 'english:question_en,arabic:question_ar',
                channel_id: `eq.${channelId}`,
                active: `eq.true`,
            },
        });

        return data;
    }
}
