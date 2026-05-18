// Custom Node modules
import { AwsS3vectorsClient } from '@shared-modules/f2-clients';

// System env vars
const REGION = process.env.AWS_REGION;

// Custom env vars
const APP_NAME = process.env.APP_NAME;
const ACCOUNT_ID = process.env.ACCOUNT_ID;
const ENV = process.env.ENV;

export default class AwsS3vectorsService {
    #client;

    constructor() {
        this.#client = new AwsS3vectorsClient();
    }

    async createVectorBucket({ aiDataSourceName, embeddingsModel }) {
        const vectorBucketName = `${APP_NAME}-${aiDataSourceName}-${ENV}`;

        const vectorBucket = await this.#client.createVectorBucket(vectorBucketName);
        console.log('vectorBucket', vectorBucket);

        // TODO Workaround
        // CreateVectorBucketCommand doesn't return Bucket ARN for unknown reason (if run on Lambda)
        // But Bucket ARN is returned (if run locally)
        // [IM] possible it relates to aws-sdk version used in lambda runtime
        if (!vectorBucket.arn) {
            vectorBucket.arn = `arn:aws:s3vectors:${REGION}:${ACCOUNT_ID}:bucket/${vectorBucketName}`;
        }

        const index = await this.#client.createIndex({
            vectorBucketArn: vectorBucket.arn,
            indexName: 'default',
            embeddingsModel,
        });
        console.log('index', index);

        // TODO Workaround as index arn also absent
        if (!index.arn) {
            index.arn = `arn:aws:s3vectors:${REGION}:${ACCOUNT_ID}:bucket/${vectorBucketName}/index/default`;
        }

        return {
            arn: vectorBucket.arn,
            name: vectorBucketName,
            indexName: 'default',
            indexArn: index.arn,
        };
    }
}
