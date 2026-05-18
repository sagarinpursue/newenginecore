import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import middy from '@middy/core';
import httpJsonBodyParser from '@middy/http-json-body-parser';
import inputOutputLogger from '@middy/input-output-logger';
import validator from '@middy/validator';

import Ajv from 'ajv';
import ajvErrors from 'ajv-errors';
import ajvFormats from 'ajv-formats';

// Custom Node modules
import { httpErrorFormatter, httpResponseFormatter } from '@shared-modules/f2-middlewares';

import { eventSchema } from './schemas/event.js';

// Env variables
const AWS_REGION = process.env.AWS_REGION;
const CORE_BUCKET = process.env.CORE_BUCKET;
const CMS_TEMP_FOLDER = process.env.CMS_TEMP_FOLDER;

// Create AJV instance and configure it with ajv-errors and ajv-formats
const ajv = new Ajv({ coerceTypes: 'number', strictTypes: false, allowUnionTypes: true, allErrors: true });
ajvFormats(ajv);
ajvErrors(ajv);

// AWS clients
const s3Client = new S3Client({ region: AWS_REGION });

export const handler = middy(async (event) => {
    const signedUrls = [];
    const { documentsMetadata, uploadDescription } = event.body;

    for (const metadata of documentsMetadata) {
        const command = new PutObjectCommand({
            Bucket: CORE_BUCKET,
            Key: `${CMS_TEMP_FOLDER}/${metadata.documentId}`,
            ContentType: metadata.documentType,
            Metadata: {
                description: uploadDescription,
            },
        });

        const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // URL valid for 1 hour

        signedUrls.push({
            signedUrl: url,
            documentId: metadata.documentId,
            documentName: metadata.documentName,
        });
    }

    return { data: signedUrls };
}).use([
    inputOutputLogger(),
    httpJsonBodyParser({
        disableContentTypeError: true,
    }),
    validator({ eventSchema: ajv.compile(eventSchema) }),
    httpResponseFormatter(),
    httpErrorFormatter(),
]);
