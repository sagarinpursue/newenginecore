import fs from 'fs/promises';
import path from 'path';

import { S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3';

const PRIVATE_BUCKET_NAME = process.env.PRIVATE_BUCKET_NAME;
const s3Client = new S3Client();

export async function uploadDirectory(dirPath) {
    try {
        console.log(`🍳 Scanning directory: ${dirPath}`);
        const entries = await fs.readdir(dirPath, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);

            if (entry.isDirectory()) {
                await uploadDirectory(fullPath);
            } else if (entry.isFile()) {
                console.log('fullPath :>> ', fullPath);
                await uploadFile(fullPath);
            }
        }
    } catch (error) {
        console.error(`❌ Error scanning directory ${dirPath}:`, error);
        throw error;
    }
}

async function uploadFile(filePath) {
    try {
        const fileContent = await fs.readFile(filePath);

        const params = {
            Bucket: PRIVATE_BUCKET_NAME,
            Key: filePath,
            Body: fileContent,
        };

        const command = new PutObjectCommand(params);
        await s3Client.send(command);
        console.log(`✅ Successfully uploaded file: ${filePath} -> s3://${PRIVATE_BUCKET_NAME}/${filePath}`);
    } catch (error) {
        console.error(`❌ Error uploading file ${filePath}:`, error);
        throw error;
    }
}

export async function removeDirectory(dirPath) {
    try {
        const listParams = {
            Bucket: PRIVATE_BUCKET_NAME,
            Prefix: `${dirPath}/`,
        };

        const listedObjects = await s3Client.send(new ListObjectsV2Command(listParams));

        if (!listedObjects.Contents || listedObjects.Contents.length === 0) {
            console.log('No files to delete.');
            return;
        }

        const deleteParams = {
            Bucket: PRIVATE_BUCKET_NAME,
            Delete: {
                Objects: listedObjects.Contents.map(({ Key }) => ({ Key })),
                Quiet: false,
            },
        };

        const deleteResult = await s3Client.send(new DeleteObjectsCommand(deleteParams));
        console.log('deleteResult: ', deleteResult);

        if (listedObjects.IsTruncated) {
            return removeDirectory(dirPath);
        }
    } catch (err) {
        console.error('Error removing files:', err);
    }
}
