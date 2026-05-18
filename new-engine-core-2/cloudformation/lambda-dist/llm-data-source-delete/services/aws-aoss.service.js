// Custom Node modules
import { AwsAossClient } from '@shared-modules/f2-clients';

// Custom env vars
const APP_NAME = process.env.APP_NAME;
const ENV = process.env.ENV;

export default class AwsAossService {
    #client;

    constructor() {
        this.#client = new AwsAossClient();
    }

    async deleteCollection(options) {
        const { aiDataSourceId, collectionId } = options;

        // Convert UUID (32 chars) to HEX (12-chars), because name must have length <= 32
        const hex = aiDataSourceId.replace(/-/g, '');
        const first_6 = hex.substring(0, 6);
        const last_6 = hex.substring(hex.length - 6);
        const shortId = first_6 + last_6;

        // Delete policies
        await this.#client.deleteNetworkSecurityPolicy(`${APP_NAME}-network-${shortId}-${ENV}`);
        await this.#client.deleteEncryptionSecurityPolicy(`${APP_NAME}-encryption-${shortId}-${ENV}`);
        await this.#client.deleteAccessPolicy(`${APP_NAME}-access-${shortId}-${ENV}`);

        // Delete collection
        await this.#client.deleteCollection(collectionId);

        // Wait until collection deleted
        await new Promise((resolve) => setTimeout(resolve, 5000));
    }
}
