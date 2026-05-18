import axios from 'axios';

export default class ConnectContactDb {
    #apiUrl;
    #apiKey;

    constructor(apiUrl, apiKey) {
        this.#apiUrl = apiUrl;
        this.#apiKey = apiKey;
    }

    async getContactSessionDetails(initialContactId) {
        const { data } = await axios.get(`${this.#apiUrl}/rest/v1/connect_contacts`, {
            params: {
                contact_id: `eq.${initialContactId}`,
            },
            headers: {
                apikey: this.#apiKey,
            },
        });

        return data[0];
    }
}
