import axios from 'axios';

export default class CmsIssueChunkDbApi {
    #apiUrl;
    #apiKey;

    constructor(apiUrl, apiKey) {
        this.#apiUrl = apiUrl;
        this.#apiKey = apiKey;
    }

    async addChunk(data) {
        const body = {
            ext_chunk_id: data.chunkId,
            s3_uri: data.s3Location,
            issue_id: data.issue_id,
        };
        await axios.post(`${this.#apiUrl}/rest/v1/cms_issue_chunks`, body, {
            headers: {
                apikey: this.#apiKey,
            },
        });
    }
}
