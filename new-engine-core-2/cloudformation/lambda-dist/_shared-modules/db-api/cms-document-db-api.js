import axios from 'axios';

export default class CmsDocumentDbApi {
    #apiUrl;
    #apiKey;
    #token;
    #query = {};

    constructor(apiUrl, apiKey, token) {
        this.#apiUrl = apiUrl;
        this.#apiKey = apiKey;
        this.#token = token;
    }

    async addDocument(payload) {
        const body = {
            document_id: payload.documentId,
            document_name: payload.documentName,
            user_id: payload.userId,
            account_id: payload.accountId,
            destination_folder: payload.destinationFolder,
        };

        await axios.post(`${this.#apiUrl}/rest/v1/cms_documents`, body, {
            headers: {
                Authorization: this.#token,
                apikey: this.#apiKey,
            },
        });
    }

    async getList(query, multiQuery = null, headers = {}) {
        if (multiQuery) {
            this.#query = new URLSearchParams();
            Object.entries(multiQuery).forEach(([key, values]) => {
                values.forEach((value) => {
                    this.#query.append(key, value);
                });
            });
        } else if (query) {
            this.#query = new URLSearchParams(query);
        }

        return await axios.get(`${this.#apiUrl}/rest/v1/cms_documents`, {
            headers: {
                Authorization: this.#token,
                prefer: headers.Prefer || headers.prefer,
                apikey: this.#apiKey,
            },
            params: this.#query,
        });
    }

    // TODO: remove accountId after creating the policy
    async getDocumentByName(documentName, accountId) {
        const { data } = await axios.get(`${this.#apiUrl}/rest/v1/cms_documents`, {
            headers: {
                Authorization: this.#token,
                apikey: this.#apiKey,
            },
            params: {
                document_name: `eq.${documentName}`,
                account_id: `eq.${accountId}`,
            },
        });

        return data;
    }

    async touchDocument(documentId) {
        await axios.patch(
            `${this.#apiUrl}/rest/v1/cms_documents`,
            {
                updated_at: new Date().toISOString(),
            },
            {
                headers: {
                    Authorization: this.#token,
                    apikey: this.#apiKey,
                },
                params: {
                    document_id: `eq.${documentId}`,
                },
            }
        );
    }
}
