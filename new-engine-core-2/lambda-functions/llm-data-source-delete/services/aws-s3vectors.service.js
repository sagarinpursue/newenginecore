// Custom Node modules
import { AwsS3vectorsClient } from '@shared-modules/f2-clients';

export default class AwsS3vectorsService {
    #client;

    constructor() {
        this.#client = new AwsS3vectorsClient();
    }

    async deleteVectorBucket(options) {
        const { vectorBucketName } = options;

        // Delete index
        await this.#client.deleteIndex({ vectorBucketName, indexName: 'default' });

        // Delete vector bucket
        await this.#client.deleteVectorBucket({ vectorBucketName });

        // Wait until collection deleted
        await new Promise((resolve) => setTimeout(resolve, 5000));
    }
}
