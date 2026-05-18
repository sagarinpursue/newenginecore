import axios from 'axios';

export default class CmsDocumentQuestionDbApi {
    #apiUrl;
    #apiKey;

    constructor(apiUrl, apiKey) {
        this.#apiUrl = apiUrl;
        this.#apiKey = apiKey;
    }

    async addQuestions(data) {
        const body = {
            s3_uri: data.s3Uri,
            questions: data.questions,
            report_id: data.reportId,
        };

        await axios.post(`${this.#apiUrl}/rest/v1/cms_document_questions`, body, {
            headers: {
                apikey: this.#apiKey,
            },
        });
    }

    async getQuestions(reportId) {
        const { data } = await axios.get(`${this.#apiUrl}/rest/v1/cms_document_questions`, {
            params: {
                report_id: `eq.${reportId}`,
            },
            headers: {
                apikey: this.#apiKey,
            },
        });

        return data;
    }
}
