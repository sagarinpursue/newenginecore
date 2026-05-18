import axios from 'axios';

export default class CmsAnalysisIssueDbApi {
    #apiUrl;
    #apiKey;

    constructor(apiUrl, apiKey) {
        this.#apiUrl = apiUrl;
        this.#apiKey = apiKey;
    }

    async addIssue(payload) {
        const body = {
            question: payload.question,
            summary: payload.summary,
            report_id: payload.reportId,
            issue_type: payload.issueType,
        };

        const { data } = await axios.post(`${this.#apiUrl}/rest/v1/cms_analysis_issues`, body, {
            headers: {
                apikey: this.#apiKey,
                Prefer: 'return=representation',
            },
        });

        return data[0];
    }
}
