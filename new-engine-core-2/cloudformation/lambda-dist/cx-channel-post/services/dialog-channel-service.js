import { randomUUID } from 'crypto';

import {
    SecretsManagerClient,
    CreateSecretCommand,
    PutSecretValueCommand,
    GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';

const ENV = process.env.ENV;
const AWS_REGION = process.env.AWS_REGION;

const secretsManagerClient = new SecretsManagerClient({ region: AWS_REGION });

export default class CustomChannelService {
    #cxChannelDbApi;

    constructor(cxChannelDbApi) {
        this.#cxChannelDbApi = cxChannelDbApi;
    }

    async create(name, chatId, accountId, vendorLabel, vendorId, vendorSecret, vendorAuth) {
        const channelId = randomUUID();
        await this.#cxChannelDbApi.create({
            channelId,
            name,
            channel: '360dialog',
            chatId,
            accountId,
            vendorLabel,
            vendorId,
        });

        const secretBody = {
            apiKey: vendorSecret,
        };

        if (vendorAuth) {
            secretBody.auth = vendorAuth;
        }

        const params = {
            Name: `f2-${ENV}/cx/channel-vendor-secret/${channelId}`,
            SecretString: JSON.stringify(secretBody),
        };

        await secretsManagerClient.send(new CreateSecretCommand(params));
    }

    async updateSecret(channelId, vendorSecret, vendorAuth) {
        const _params = {
            SecretId: `f2-${ENV}/cx/channel-vendor-secret/${channelId}`,
        };

        const { SecretString } = await secretsManagerClient.send(new GetSecretValueCommand(_params));
        const storedSecret = JSON.parse(SecretString);

        if (vendorSecret) {
            storedSecret.apiKey = vendorSecret;
        }

        if (vendorAuth) {
            storedSecret.auth = vendorAuth;
        }

        const params = {
            SecretId: `f2-${ENV}/cx/channel-vendor-secret/${channelId}`,
            SecretString: JSON.stringify(storedSecret),
        };

        await secretsManagerClient.send(new PutSecretValueCommand(params));
    }
}
