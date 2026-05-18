// Native and 3rd party Node modules
import {
    S3VectorsClient,
    CreateVectorBucketCommand,
    CreateIndexCommand,
    DeleteIndexCommand,
    DeleteVectorBucketCommand,
} from '@aws-sdk/client-s3vectors';

// System env vars
const REGION = process.env.AWS_REGION;

export default class AwsS3vectorsClient {
    #client;

    constructor() {
        this.#client = new S3VectorsClient({
            region: REGION,
        });
    }

    async createVectorBucket(bucketName) {
        const response = await this.#client.send(
            new CreateVectorBucketCommand({
                vectorBucketName: bucketName,
            })
        );
        return {
            arn: response.vectorBucketArn,
        };
    }

    async createIndex({ vectorBucketArn, indexName, embeddingsModel }) {
        const response = await this.#client.send(
            new CreateIndexCommand({
                vectorBucketArn,
                indexName,
                dataType: 'float32',
                dimension: embeddingsModel === 'amazon.titan-embed-text-v1' ? 1536 : 1024,
                distanceMetric: 'euclidean',
                metadataConfiguration: {
                    nonFilterableMetadataKeys: ['AMAZON_BEDROCK_TEXT', 'AMAZON_BEDROCK_METADATA'],
                },
            })
        );
        return {
            arn: response.indexArn,
        };
    }

    async deleteVectorBucket({ vectorBucketName }) {
        await this.#client
            .send(
                new DeleteVectorBucketCommand({
                    vectorBucketName,
                })
            )
            .catch((e) => {
                if (e.name !== 'NotFoundException') {
                    throw e;
                }
            });
    }

    async deleteIndex({ vectorBucketName, indexName }) {
        await this.#client
            .send(
                new DeleteIndexCommand({
                    vectorBucketName,
                    indexName,
                })
            )
            .catch((e) => {
                if (e.name !== 'NotFoundException') {
                    throw e;
                }
            });
    }
}
