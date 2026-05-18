import { S3Client, CopyObjectCommand } from '@aws-sdk/client-s3';

import middy from '@middy/core';
import httpJsonBodyParser from '@middy/http-json-body-parser';
import inputOutputLogger from '@middy/input-output-logger';
import secretsManager from '@middy/secrets-manager';
import validator from '@middy/validator';

import Ajv from 'ajv';
import ajvErrors from 'ajv-errors';
import ajvFormats from 'ajv-formats';

// Custom Node modules
import { CmsDocumentDbApi, UserDbApi } from '@shared-modules/f2-db-api';
import { httpErrorFormatter, httpResponseFormatter } from '@shared-modules/f2-middlewares';
import { areCmsFoldersEqual, isCmsRootFolder } from '@shared-modules/utils';

import { eventSchema } from './schemas/event.js';

// Env variables
const DB_API_URL = process.env.DB_API_URL;
const JWT_AUTHORIZER_SECRET = process.env.JWT_AUTHORIZER_SECRET;
const AWS_REGION = process.env.AWS_REGION;
const CMS_BUCKET = process.env.CMS_BUCKET;
const CORE_BUCKET = process.env.CORE_BUCKET;
const CMS_TEMP_FOLDER = process.env.CMS_TEMP_FOLDER;

// Create AJV instance and configure it with ajv-errors and ajv-formats
const ajv = new Ajv({ coerceTypes: 'number', strictTypes: false, allowUnionTypes: true, allErrors: true });
ajvFormats(ajv);
ajvErrors(ajv);

// AWS clients
const s3Client = new S3Client({ region: AWS_REGION });

export const handler = middy(async (event, context) => {
    const { documents, destinationFolder } = event.body;
    const { Authorization } = event.headers;

    const cmsDocumentDbApi = new CmsDocumentDbApi(DB_API_URL, context.jwtAuth.anonKey, Authorization);
    const userDbApi = new UserDbApi(DB_API_URL, context.jwtAuth.anonKey, Authorization);
    const userId = await userDbApi.getMe();
    const accountId = await userDbApi.getAccountId(userId);

    const isRootFolder = isCmsRootFolder(destinationFolder);

    let targetDocumentId;
    let shouldCreateDocumentRecord;

    for (let document of documents) {
        const data = await cmsDocumentDbApi.getDocumentByName(document.documentName, accountId);

        if (data.length > 0 && areCmsFoldersEqual(data[0].destination_folder, destinationFolder)) {
            shouldCreateDocumentRecord = false;
            targetDocumentId = data[0].document_id;
        } else {
            shouldCreateDocumentRecord = true;
            targetDocumentId = document.documentId;
        }

        const input = {
            Bucket: CMS_BUCKET,
            CopySource: `/${CORE_BUCKET}/${CMS_TEMP_FOLDER}/${document.documentId}`,
            Key: isRootFolder ? targetDocumentId : `${destinationFolder}/${targetDocumentId}`,
        };

        const command = new CopyObjectCommand(input);
        const response = await s3Client.send(command);

        if (response.$metadata.httpStatusCode === 200) {
            if (shouldCreateDocumentRecord) {
                // Create a new record
                const requestBody = {
                    userId: userId,
                    accountId: accountId,
                    documentId: document.documentId,
                    documentName: document.documentName,
                    destinationFolder: isRootFolder ? null : destinationFolder,
                };

                await cmsDocumentDbApi.addDocument(requestBody);
            } else {
                // Update a record
                await cmsDocumentDbApi.touchDocument(targetDocumentId);
            }
        }
    }

    return { data: '' };
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
