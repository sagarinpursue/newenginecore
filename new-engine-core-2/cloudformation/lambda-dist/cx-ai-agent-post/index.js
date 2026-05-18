// Native and 3rd party Node modules
import middy from '@middy/core';
import httpJsonBodyParser from '@middy/http-json-body-parser';
import inputOutputLogger from '@middy/input-output-logger';
import secretsManager from '@middy/secrets-manager';
import validator from '@middy/validator';

import Ajv from 'ajv';
import ajvErrors from 'ajv-errors';
import ajvFormats from 'ajv-formats';

// Custom Node modules
import { UserDbApi } from '@shared-modules/f2-db-api';
import { httpErrorFormatter, httpResponseFormatter } from '@shared-modules/f2-middlewares';

import { eventSchema } from './schemas/event.js';
import { createNew, importExisting } from './services/cx-ai-agent.service.js';

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

    if (body.agentId) {
        const aiAgent = await importExisting({
            dbApiKey: context.jwtAuth.anonKey,
            token,
            data: {
                name: body.name,
                agentId: body.agentId,
                agentAliasId: body.agentAliasId,

                userId,
                accountId,
            },
        });
        return {
            data: {
                cxAiAgentId: aiAgent.id,
            },
        };
    } else {
        const aiAgent = await createNew({
            dbApiKey: context.jwtAuth.anonKey,
            token,
            data: {
                name: body.name,
                model: body.model,
                instruction: body.instruction,
                agentCollaboration: body.agentCollaboration,

                userId,
                accountId,
            },
        });
        return {
            data: {
                cxAiAgentId: aiAgent.id,
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
