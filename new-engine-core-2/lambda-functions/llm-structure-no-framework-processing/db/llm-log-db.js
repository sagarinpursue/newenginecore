import axios from 'axios';

export default class LlmLogDb {
    #apiUrl;
    #apiKey;
    #token;

    constructor(apiUrl, apiKey, token) {
        this.#apiUrl = apiUrl;
        this.#apiKey = apiKey;
        this.#token = token;
    }

    async get({ llmStructureId, sessionId, memorySize }) {
        const { data } = await axios.get(`${this.#apiUrl}/rest/v1/llm_log`, {
            headers: {
                Authorization: this.#token,
                apikey: this.#apiKey,
            },
            params: {
                llm_structure_id: `eq.${llmStructureId}`,
                session_id: `eq.${sessionId}`,
                select: 'question, answer',
                limit: memorySize,
                order: 'created_at.asc',
            },
        });
        return data;
    }

    async save({ llmStructureId, sessionId, question, answer, sources }) {
        const body = {
            llm_structure_id: llmStructureId,
            session_id: sessionId,
            question: question,
            answer: answer,
            sources: sources,
        };
        return axios.post(`${this.#apiUrl}/rest/v1/llm_log`, body, {
            headers: {
                Authorization: this.#token,
                apikey: this.#apiKey,
            },
        });
    }
}
