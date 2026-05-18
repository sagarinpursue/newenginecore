// Native and 3rd party Node modules
import { CollectionStatus } from '@aws-sdk/client-opensearchserverless';

// Custom Node modules
import { AwsAossClient } from '@shared-modules/f2-clients';

// Custom env vars
const APP_NAME = process.env.APP_NAME;
const ENV = process.env.ENV;
const BEDROCK_KNOWLEDGE_BASE_ROLE_ARN = process.env.BEDROCK_KNOWLEDGE_BASE_ROLE_ARN;
const LAMBDA_DATA_SOURCE_ROLE_ARN = process.env.LAMBDA_DATA_SOURCE_ROLE_ARN;

export default class AwsAossService {
    #client;

    constructor() {
        this.#client = new AwsAossClient();
    }

    async createCollection(options) {
        const { aiDataSourceId, aiDataSourceName, embeddingsModel } = options;

        // Convert UUID (32 chars) to HEX (12-chars), because name must have length <= 32
        const hex = aiDataSourceId.replace(/-/g, '');
        const first_6 = hex.substring(0, 6);
        const last_6 = hex.substring(hex.length - 6);
        const shortId = first_6 + last_6;

        // Build collection name
        const collectionName = `${APP_NAME}-${shortId}-${ENV}`;

        // Create policies
        await this.#client.createNetworkSecurityPolicy({
            name: `${APP_NAME}-network-${shortId}-${ENV}`,
            collectionName,
        });
        await this.#client.createEncryptionSecurityPolicy({
            name: `${APP_NAME}-encryption-${shortId}-${ENV}`,
            collectionName,
        });
        await this.#client.createAccessPolicy({
            name: `${APP_NAME}-access-${shortId}-${ENV}`,
            collectionName,
            roles: [
                LAMBDA_DATA_SOURCE_ROLE_ARN,
                BEDROCK_KNOWLEDGE_BASE_ROLE_ARN,
                //TODO: Need to local testing only
                // 'arn:aws:iam::605134443604:user/deploy'
            ],
        });

        // Create collection
        let collection = await this.#client.createCollection({
            name: collectionName,
            description: `[${APP_NAME} ${ENV}] Collection for ${aiDataSourceName} data source`,
        });
        console.log('collection', collection);

        // Wait until collection created
        while (collection.status !== CollectionStatus.ACTIVE) {
            await new Promise((resolve) => setTimeout(resolve, 5000));
            collection = await this.#client.getCollection(collection.id);
            console.log('collection', collection);
        }

        // Wait until collection policy applied
        await new Promise((resolve) => setTimeout(resolve, 30000));

        await this.#client.createIndex({
            collectionId: collection.id,
            indexName: aiDataSourceId, // TODO: probably, better name should be used
            embeddingsModel,
        });

        // Wait until collection index created
        await new Promise((resolve) => setTimeout(resolve, 30000));

        return {
            id: collection.id,
            arn: collection.arn,
            name: collection.name,
            status: collection.status,
            indexName: aiDataSourceId, // TODO: probably, better name should be used
        };
    }
}
