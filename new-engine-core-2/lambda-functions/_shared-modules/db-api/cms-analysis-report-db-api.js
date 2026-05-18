import axios from 'axios';

export default class CmsAnalysisReportDbApi {
    #apiUrl;
    #apiKey;

    constructor(apiUrl, apiKey) {
        this.#apiUrl = apiUrl;
        this.#apiKey = apiKey;
    }

    async updateReportStatus(status, reportId) {
        await axios.patch(
            `${this.#apiUrl}/rest/v1/cms_analysis_reports`,
            { status: status },
            {
                params: {
                    report_id: `eq.${reportId}`,
                },
                headers: {
                    apikey: this.#apiKey,
                },
            }
        );
    }
}
