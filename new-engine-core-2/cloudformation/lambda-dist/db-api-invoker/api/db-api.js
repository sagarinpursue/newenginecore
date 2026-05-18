import axios from 'axios';

export default class DbApi {
    #apiUrl;
    #apiAnonKey;
    #apiServiceKey;
    #method;
    #headers;
    #body;
    #query;

    constructor(apiUrl, apiAnonKey, apiServiceKey, method, headers, body, query, multiQuery = null) {
        this.#apiUrl = apiUrl;
        this.#apiAnonKey = apiAnonKey;
        this.#apiServiceKey = apiServiceKey;
        this.#method = method;
        this.#headers = headers;
        this.#body = body;
        if (multiQuery) {
            this.#query = new URLSearchParams();
            Object.entries(multiQuery).forEach(([key, values]) => {
                values.forEach((value) => {
                    this.#query.append(key, value);
                });
            });
        } else {
            this.#query = new URLSearchParams(query);
        }
    }

    async callRest(endpoint, admin = false) {
        return this.#call(`${this.#apiUrl}/rest/v1/${endpoint}`, admin);
    }

    async callAuth(endpoint, admin = false) {
        return this.#call(`${this.#apiUrl}/auth/v1/${endpoint}`, admin);
    }

    async #call(endpoint, admin = false) {
        const params = {
            method: this.#method.toLowerCase(),
            url: endpoint,
            headers: {
                Authorization: this.#headers?.Authorization || this.#headers?.authorization,
                'Content-Type': this.#headers?.['content-type'] || this.#headers?.['Content-Type'],
                prefer: this.#headers?.Prefer || this.#headers?.prefer,
                apikey: this.#apiAnonKey,
            },
            params: this.#query,
        };

        if (admin) {
            params.headers.Authorization = `Bearer ${this.#apiServiceKey}`;
            params.headers.apikey = this.#apiServiceKey;
        }

        // put 'data' if body is not empty
        // because 'data' is forbidden for GET, DELETE requests
        if (this.#body && Object.keys(this.#body).length > 0) {
            params.data = this.#body;
        }

        console.log('DbApi -> #call -> params:', params);
        return axios.request(params);
    }
}
