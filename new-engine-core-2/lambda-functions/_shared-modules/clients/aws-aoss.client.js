// Native and 3rd party Node modules
import { randomUUID } from 'crypto';

import {
    BatchGetCollectionCommand,
    CreateAccessPolicyCommand,
    CreateCollectionCommand,
    CreateSecurityPolicyCommand,
    CreateIndexCommand,
    OpenSearchServerlessClient,
    DeleteCollectionCommand,
    DeleteAccessPolicyCommand,
    DeleteSecurityPolicyCommand,
} from '@aws-sdk/client-opensearchserverless';

// System env vars
const REGION = process.env.AWS_REGION;

export default class AwsAossClient {
    #client;

    constructor() {
        this.#client = new OpenSearchServerlessClient({
            region: REGION,
        });
    }

    async createCollection(options) {
        const { name, description } = options;
        const response = await this.#client.send(
            new CreateCollectionCommand({
                name,
                type: 'VECTORSEARCH', // Required for AWS Bedrock
                description,
                standbyReplicas: 'DISABLED', // ???
            })
        );
        return {
            id: response.createCollectionDetail.id,
            arn: response.createCollectionDetail.arn,
            name: response.createCollectionDetail.name,
            status: response.createCollectionDetail.status,
        };
    }

    async getCollection(collectionId) {
        const response = await this.#client.send(
            new BatchGetCollectionCommand({
                ids: [collectionId],
            })
        );
        return {
            id: response.collectionDetails[0].id,
            arn: response.collectionDetails[0].arn,
            name: response.collectionDetails[0].name,
            status: response.collectionDetails[0].status,
        };
    }

    async deleteCollection(collectionId) {
        await this.#client
            .send(
                new DeleteCollectionCommand({
                    id: collectionId,
                    clientToken: randomUUID(),
                })
            )
            .catch((err) => {
                if (err.name !== 'ResourceNotFoundException') {
                    throw new Error(err);
                }
            });
    }

    async createAccessPolicy(options) {
        const { name, collectionName, roles } = options;
        await this.#client.send(
            new CreateAccessPolicyCommand({
                name,
                type: 'data',
                policy: JSON.stringify([
                    {
                        Rules: [
                            {
                                ResourceType: 'index',
                                Resource: [`index/${collectionName}/*`],
                                Permission: [
                                    'aoss:CreateIndex',
                                    'aoss:UpdateIndex',
                                    'aoss:DescribeIndex',
                                    'aoss:DeleteIndex',
                                    'aoss:ReadDocument',
                                    'aoss:WriteDocument',
                                ],
                            },
                            {
                                ResourceType: 'collection',
                                Resource: [`collection/${collectionName}`],
                                Permission: [
                                    'aoss:CreateCollectionItems',
                                    'aoss:UpdateCollectionItems',
                                    'aoss:DescribeCollectionItems',
                                    'aoss:DeleteCollectionItems',
                                ],
                            },
                        ],
                        Principal: roles,
                    },
                ]),
            })
        );
    }

    async deleteAccessPolicy(name) {
        await this.#client
            .send(
                new DeleteAccessPolicyCommand({
                    name,
                    type: 'data',
                    clientToken: randomUUID(),
                })
            )
            .catch((err) => {
                if (err.name !== 'ResourceNotFoundException') {
                    throw new Error(err);
                }
            });
    }

    async createEncryptionSecurityPolicy(options) {
        const { name, collectionName } = options;
        await this.#client.send(
            new CreateSecurityPolicyCommand({
                name,
                type: 'encryption',
                policy: JSON.stringify({
                    Rules: [
                        {
                            ResourceType: 'collection',
                            Resource: [`collection/${collectionName}`],
                        },
                    ],
                    AWSOwnedKey: true,
                }),
            })
        );
    }

    async deleteEncryptionSecurityPolicy(name) {
        await this.#client
            .send(
                new DeleteSecurityPolicyCommand({
                    name,
                    type: 'encryption',
                    clientToken: randomUUID(),
                })
            )
            .catch((err) => {
                if (err.name !== 'ResourceNotFoundException') {
                    throw new Error(err);
                }
            });
    }

    async createNetworkSecurityPolicy(options) {
        const { name, collectionName } = options;
        const params = {
            name,
            type: 'network',
            policy: JSON.stringify([
                {
                    Rules: [
                        {
                            ResourceType: 'collection',
                            Resource: [`collection/${collectionName}`],
                        },
                    ],
                    AllowFromPublic: true,
                },
            ]),
        };
        await this.#client.send(new CreateSecurityPolicyCommand(params));
    }

    async deleteNetworkSecurityPolicy(name) {
        await this.#client
            .send(
                new DeleteSecurityPolicyCommand({
                    name,
                    type: 'network',
                    clientToken: randomUUID(),
                })
            )
            .catch((err) => {
                if (err.name !== 'ResourceNotFoundException') {
                    throw new Error(err);
                }
            });
    }

    async createIndex(options) {
        const { collectionId, indexName, embeddingsModel } = options;
        await this.#client.send(
            new CreateIndexCommand({
                id: collectionId,
                indexName,
                indexSchema: {
                    settings: {
                        index: {
                            knn: true,
                            'knn.algo_param.ef_search': 512,
                        },
                        // https://repost.aws/questions/QUY5AnoceaTLWbu0XkIfhzcw/is-it-necessary-to-specify-the-number-of-shards-when-creating-an-index-in-an-opensearch-serverless-collection
                        // Index and shard management is taken care by serverless, you don't need to worry about specifying the shards/replica for an index.
                        // Even if you have those settings in your index template or index creation step, it would be ignored.
                    },
                    mappings: {
                        properties: {
                            vector: {
                                type: 'knn_vector',
                                // [IM] do we need to make dimensions configurable on UI?
                                dimension: embeddingsModel === 'amazon.titan-embed-text-v1' ? 1536 : 1024,
                                method: {
                                    name: 'hnsw',
                                    space_type: 'l2',
                                    engine: 'faiss',
                                    parameters: {
                                        m: 16,
                                        ef_construction: 512,
                                    },
                                },
                            },
                            id: {
                                type: 'text',
                                index: true,
                            },
                            text: {
                                type: 'text',
                                index: true,
                            },
                            metadata: {
                                type: 'text',
                                index: false,
                            },
                        },
                    },
                },
            })
        );
    }
}
