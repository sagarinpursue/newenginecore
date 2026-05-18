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

    async saveResult(result) {
        const body = {
            session_id: result.sessionId,
            question_id: result.questionId,
            answer_id: result.answerId,
            question: result.question,
            answer: result.answer,
            category: result.category,
            verdict: result.verdict,
            account_id: result.accountId,
            channel_id: result.channelId,
        };

        await axios.post(`${this.#apiUrl}/rest/v1/chat_message_analysis`, body, {
            headers: {
                Authorization: this.#token,
                apikey: this.#apiKey,
            },
        });
    }
}
