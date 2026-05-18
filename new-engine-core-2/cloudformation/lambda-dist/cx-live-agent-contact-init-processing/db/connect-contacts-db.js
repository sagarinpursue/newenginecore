import axios from 'axios';

export default class ConnectContactDb {
    #apiUrl;
    #apiKey;

    constructor(apiUrl, apiKey) {
        this.#apiUrl = apiUrl;
        this.#apiKey = apiKey;
    }

    async createContact(body) {
        await axios.post(`${this.#apiUrl}/rest/v1/connect_contacts`, body, {
            headers: {
                apikey: this.#apiKey,
            },
        });
    }
}
