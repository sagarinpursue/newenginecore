import axios from 'axios';

export default class RpcDbApi {
    #apiUrl;
    #apiKey;

    constructor(apiUrl, apiKey) {
        this.#apiUrl = apiUrl;
        this.#apiKey = apiKey;
    }

    async getChatConfig(channelId) {
        const { data } = await axios.get(`${this.#apiUrl}/rest/v1/rpc/get_cx_chat_config`, {
            headers: {
                apikey: this.#apiKey,
                Authorization: `Bearer ${this.#apiKey}`,
            },
            params: {
                channel_id_param: channelId,
            },
        });

        return data;
    }

    async getVendorConfig(vendorId) {
        const { data } = await axios.get(`${this.#apiUrl}/rest/v1/rpc/get_cx_vendor_config`, {
            headers: {
                apikey: this.#apiKey,
                Authorization: `Bearer ${this.#apiKey}`,
            },
            params: {
                vendor_id_param: vendorId,
            },
        });

        return data;
    }
}
