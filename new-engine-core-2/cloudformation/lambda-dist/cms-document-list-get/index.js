import { S3Client, HeadObjectCommand } from '@aws-sdk/client-s3';

import middy from '@middy/core';
import httpJsonBodyParser from '@middy/http-json-body-parser';
import inputOutputLogger from '@middy/input-output-logger';
import secretsManager from '@middy/secrets-manager';
import validator from '@middy/validator';

import Ajv from 'ajv';
import ajvErrors from 'ajv-errors';
import ajvFormats from 'ajv-formats';

// Custom Node modules
import { CmsDocumentDbApi } from '@shared-modules/f2-db-api';
import { httpErrorFormatter, httpResponseFormatter } from '@shared-modules/f2-middlewares';
import { isCmsRootFolder } from '@shared-modules/utils';

import { eventSchema } from './schemas/event.js';

// Env variables
const DB_API_URL = process.env.DB_API_URL;
const JWT_AUTHORIZER_SECRET = process.env.JWT_AUTHORIZER_SECRET;
const AWS_REGION = process.env.AWS_REGION;
const CMS_BUCKET = process.env.CMS_BUCKET;

// Create AJV instance and configure it with ajv-errors and ajv-formats
const ajv = new Ajv({ coerceTypes: 'number', strictTypes: false, allowUnionTypes: true, allErrors: true });
ajvFormats(ajv);
ajvErrors(ajv);

// AWS Clients
const s3Client = new S3Client({ region: AWS_REGION });

export const handler = middy(async (event, context) => {
    const { Authorization } = event.headers;
    const query = event.queryStringParameters;
    const multiQuery = event.multiValueQueryStringParameters;

    const cmsDocumentDbApi = new CmsDocumentDbApi(DB_API_URL, context.jwtAuth.anonKey, Authorization);

    // TODO: find a way to pass params betters
    const documentDbResponse = await cmsDocumentDbApi.getList(query, multiQuery, event.headers);

    const responseDocumentsData = [];

    for (const record of documentDbResponse.data) {
        const folder = record.destination_folder;
        const documentId = record.document_id;
        const params = {
            Bucket: CMS_BUCKET,
            Key: isCmsRootFolder(folder) ? documentId : `${folder}/${documentId}`,
        };

        const command = new HeadObjectCommand(params);
        const response = await s3Client.send(command);

        responseDocumentsData.push({
            documentName: record.document_name,
            documentId: record.document_id,
            createdAt: record.created_at,
            updatedAt: record.updated_at,
            destinationFolder: record.destination_folder,
            metadata: {
                description: response.Metadata.description,
            },
        });
    }

    return {
        ...documentDbResponse,
        data: responseDocumentsData,
    };
}).use([
    inputOutputLogger(),
    httpJsonBodyParser({
        disableContentTypeError: true,
    }),
    secretsManager({
        fetchData: {
            jwtAuth: JWT_AUTHORIZER_SECRET,
        },
        disablePrefetch: true,
        setToContext: true,
    }),
    validator({ eventSchema: ajv.compile(eventSchema) }),
    httpResponseFormatter(),
    httpErrorFormatter(),
]);
