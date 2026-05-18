import axios from 'axios';

export default class UserDb {
    #apiUrl;
    #apiKey;
    #token;

    constructor(apiUrl, apiKey, token) {
        this.#apiUrl = apiUrl;
        this.#apiKey = apiKey;
        this.#token = token;
    }

    async get() {
        const { data } = await axios.get(`${this.#apiUrl}/auth/v1/user`, {
            headers: {
                Authorization: this.#token,
                apikey: this.#apiKey,
            },
        });
        return data.id;
    }

    async getAccount(userId) {
        const { data } = await axios.get(`${this.#apiUrl}/rest/v1/user_refs`, {
            params: {
                user_id: `eq.${userId}`,
            },
            headers: {
                Authorization: this.#token,
                apikey: this.#apiKey,
            },
        });
        return data[0]?.user_account_id;
    }
}
