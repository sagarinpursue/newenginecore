import { randomUUID } from 'crypto';

export default class CustomChannelService {
    #cxChannelDbApi;

    constructor(cxChannelDbApi) {
        this.#cxChannelDbApi = cxChannelDbApi;
    }

    async create(name, chatId, accountId) {
        const channelId = randomUUID();
        await this.#cxChannelDbApi.create({
            channelId,
            name,
            channel: 'custom',
            chatId,
            accountId,
        });
    }
}
