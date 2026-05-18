// Native and 3rd party Node modules
import {
    S3Client,
    GetBucketVersioningCommand,
    ListObjectVersionsCommand,
    ListObjectsV2Command,
    DeleteObjectsCommand,
} from '@aws-sdk/client-s3';

export default class AwsS3Client {
    #client;

    constructor() {
        this.#client = new S3Client();
    }

    async emptyBucketDirectory(bucketName, dirPath = '') {
        try {
            const versioning = await this.#client.send(new GetBucketVersioningCommand({ Bucket: bucketName }));
            const isVersioned = versioning.Status === 'Enabled' || versioning.Status === 'Suspended';

            if (isVersioned) {
                console.log('Bucket is versioned, deleting all versions...');
                await this.#deleteAllVersions(bucketName, dirPath);
            } else {
                console.log('Bucket is not versioned, deleting current objects...');
                await this.#deleteCurrentObjects(bucketName, dirPath);
            }
        } catch (err) {
            console.error('Error emptying bucket directory:', err);
        }
    }

    async #deleteCurrentObjects(bucketName, dirPath) {
        const listParams = {
            Bucket: bucketName,
            Prefix: dirPath,
        };

        const listedObjects = await this.#client.send(new ListObjectsV2Command(listParams));

        if (!listedObjects.Contents || listedObjects.Contents.length === 0) {
            console.log('No files to delete.');
            return;
        }

        const deleteParams = {
            Bucket: bucketName,
            Delete: {
                Objects: listedObjects.Contents.map(({ Key }) => ({ Key })),
                Quiet: false,
            },
        };

        const deleteResult = await this.#client.send(new DeleteObjectsCommand(deleteParams));
        console.log('deleteResult: ', deleteResult?.Deleted);

        if (listedObjects.IsTruncated) {
            return this.#deleteCurrentObjects(bucketName, dirPath);
        }
    }

    async #deleteAllVersions(bucketName, dirPath) {
        const listedVersions = await this.#client.send(
            new ListObjectVersionsCommand({
                Bucket: bucketName,
                Prefix: dirPath,
            })
        );

        const objectsToDelete = [];

        if (listedVersions.Versions) {
            objectsToDelete.push(
                ...listedVersions.Versions.map((v) => ({
                    Key: v.Key,
                    VersionId: v.VersionId,
                }))
            );
        }

        if (listedVersions.DeleteMarkers) {
            objectsToDelete.push(
                ...listedVersions.DeleteMarkers.map((m) => ({
                    Key: m.Key,
                    VersionId: m.VersionId,
                }))
            );
        }

        if (objectsToDelete.length === 0) {
            console.log('No versions to delete.');
            return;
        }

        const deleteParams = {
            Bucket: bucketName,
            Delete: { Objects: objectsToDelete },
        };

        await this.#client.send(new DeleteObjectsCommand(deleteParams));
        console.log('Deleted versions:', deleteParams.Delete.Objects);

        if (listedVersions.IsTruncated) {
            await this.#deleteAllVersions(bucketName, dirPath);
        }
    }
}
