import axios from 'axios';

export default class CxConnectInstanceDbApi {
    #apiKey;
    #apiUrl;
    #token;

    constructor(apiUrl, apiKey, token) {
        this.#apiKey = apiKey;
        this.#apiUrl = apiUrl;
        this.#token = token;
    }

    async getList() {
        const { data } = await axios.get(`${this.#apiUrl}/rest/v1/connect_instances`, {
            headers: {
                apikey: this.#apiKey,
                Authorization: this.#token,
            },
        });

        return data;
    }
}
