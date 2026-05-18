import axios from 'axios';

export default class CxChannelDbApi {
    #apiUrl;
    #apiKey;
    #token;

    constructor(apiUrl, apiKey, token) {
        this.#apiUrl = apiUrl;
        this.#apiKey = apiKey;
        this.#token = token;
    }

    async get(channelId) {
        console.log('CxChannelDbApi -> get -> channelId:', channelId);
        const { data } = await axios.get(`${this.#apiUrl}/rest/v1/channels`, {
            headers: {
                Authorization: this.#token,
                apikey: this.#apiKey,
            },
            params: {
                channel_id: `eq.${channelId}`,
            },
        });
        return data[0]
            ? {
                  channelId: data[0].channel_id,
                  chatId: data[0].chat_id,
                  name: data[0].name,
                  channel: data[0].channel,
                  domainName: data[0].domain_name,
                  distributionId: data[0].distribution_id,
                  vendorId: data[0].vendor_id,
                  vendorLabel: data[0].vendor_label,
              }
            : null;
    }

    async create(data) {
        console.log('CxChannelDbApi -> create -> data:', data);
        const body = {
            channel_id: data.channelId,
            name: data.name,
            channel: data.channel,
            chat_id: data.chatId,
            domain_name: data.domainName,
            distribution_id: data.distributionId,
            account_id: data.accountId,
            vendor_id: data.vendorId,
            vendor_label: data.vendorLabel,
        };
        console.log('CxChannelDbApi -> create -> body:', body);
        await axios.post(`${this.#apiUrl}/rest/v1/channels`, body, {
            headers: {
                Authorization: this.#token,
                apikey: this.#apiKey,
            },
        });
    }

    async update(channelId, data) {
        console.log('CxChannelDbApi -> update -> channelId:', channelId);
        console.log('CxChannelDbApi -> update -> data:', data);
        const body = {
            chat_id: data.chatId,
            vendor_id: data.vendorId,
            vendor_label: data.vendorLabel,
        };
        await axios.patch(`${this.#apiUrl}/rest/v1/channels`, body, {
            headers: {
                Authorization: this.#token,
                apikey: this.#apiKey,
            },
            params: {
                channel_id: `eq.${channelId}`,
            },
        });
    }

    async remove(channelId) {
        console.log('CxChannelDbApi -> remove -> channelId:', channelId);
        await axios.delete(`${this.#apiUrl}/rest/v1/channels`, {
            headers: {
                Authorization: this.#token,
                apikey: this.#apiKey,
            },
            params: {
                channel_id: `eq.${channelId}`,
            },
        });
    }
}
