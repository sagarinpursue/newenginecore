import middy from '@middy/core';
import httpJsonBodyParser from '@middy/http-json-body-parser';
import inputOutputLogger from '@middy/input-output-logger';
import secretsManager from '@middy/secrets-manager';
import validator from '@middy/validator';

import Ajv from 'ajv';
import ajvErrors from 'ajv-errors';
import ajvFormats from 'ajv-formats';

import { UserDbApi } from '@shared-modules/f2-db-api';
import { httpErrorFormatter, httpResponseFormatter } from '@shared-modules/f2-middlewares';

// Custom Node modules
import { eventSchema } from './schemas/event.js';
import { createNew, importExisting } from './services/ai-data-source.service.js';

// Custom env vars
const DB_API_URL = process.env.DB_API_URL;
const JWT_AUTHORIZER_SECRET = process.env.JWT_AUTHORIZER_SECRET;

// Create AJV instance and configure it with ajv-errors and ajv-formats
const ajv = new Ajv({ coerceTypes: 'number', strictTypes: false, allowUnionTypes: true, allErrors: true });
ajvFormats(ajv);
ajvErrors(ajv);

export const handler = middy(async (event, context) => {
    const token = event.headers.Authorization;
    const body = event.body;

    const userDbApi = new UserDbApi(DB_API_URL, context.jwtAuth.anonKey, token);
    const userId = await userDbApi.getMe();
    console.log('userId:', userId);
    const accountId = await userDbApi.getAccountId(userId);
    console.log('accountId:', accountId);
    body.userId = userId;
    body.accountId = accountId;

    if (body.knowledgeBaseId) {
        const dataSource = await importExisting({
            dbApiKey: context.jwtAuth.anonKey,
            token,
            data: {
                name: body.name,

                knowledgeBaseId: body.knowledgeBaseId,

                userId: body.userId,
                accountId: body.accountId,
            },
        });
        return {
            data: {
                llmDataSourceId: dataSource.id,
            },
        };
    } else {
        const dataSource = await createNew({
            dbApiKey: context.jwtAuth.anonKey,
            token,
            data: {
                name: body.name,

                chunkingStrategy: body.chunkingStrategy,
                chunkSize: body.chunkSize,
                embeddingModels: body.embeddingModels,
                sourceType: body.sourceType,
                s3Folder: body.s3Folder,
                url: body.url,
                destinationType: body.destinationType,

                userId: body.userId,
                accountId: body.accountId,
            },
        });
        return {
            data: {
                llmDataSourceId: dataSource.id,
            },
        };
    }
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
