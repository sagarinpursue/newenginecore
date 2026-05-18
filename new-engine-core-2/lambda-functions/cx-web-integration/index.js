// Native and 3rd party Node modules
import middy from '@middy/core';
import httpJsonBodyParser from '@middy/http-json-body-parser';
import inputOutputLogger from '@middy/input-output-logger';
import secretsManager from '@middy/secrets-manager';
import validator from '@middy/validator';

import Ajv from 'ajv';
import ajvErrors from 'ajv-errors';
import ajvFormats from 'ajv-formats';

import { ChatbotSessionDbApi, RpcDbApi } from '@shared-modules/f2-db-api';
import { httpErrorFormatter, httpResponseFormatter } from '@shared-modules/f2-middlewares';

// Custom Node modules
import { eventSchema } from './schemas/event.js';
import { invokeLambda } from './services/lambda-service.js';

// Custom env vars
const DB_API_URL = process.env.DB_API_URL;
const JWT_AUTHORIZER_SECRET = process.env.JWT_AUTHORIZER_SECRET;
const REQUEST_PROCESSING_ARN = process.env.REQUEST_PROCESSING_ARN;

// Create AJV instance and configure it with ajv-errors and ajv-formats
const ajv = new Ajv({ coerceTypes: 'number', strictTypes: false, allowUnionTypes: true, allErrors: true });
ajvFormats(ajv);
ajvErrors(ajv);

export const handler = middy(async (event, context) => {
    const body = event.body;

    console.log('Session ID:', body.sessionId);
    console.log('Channel ID:', body.channelId);

    const rpcDb = new RpcDbApi(DB_API_URL, context.jwtAuth.serviceRoleKey);
    const chatbotSessionDb = new ChatbotSessionDbApi(
        DB_API_URL,
        context.jwtAuth.serviceRoleKey,
        `Bearer ${context.jwtAuth.serviceRoleKey}`
    );

    const config = await rpcDb.getChatConfig(body.channelId);
    if (!config) {
        console.error('>>>>> Config not found');
        return { data: { data: Date.now() } };
    }

    let session = await chatbotSessionDb.getSessionById(body.sessionId);
    if (!session) {
        session = await chatbotSessionDb.createSession({
            chatId: config.chatId,
            sessionId: body.sessionId,
            channelId: body.channelId,
            accountId: config.accountId,
        });
    }

    const payload = {
        sessionId: body.sessionId,
        channelId: body.channelId,
        input: body.input,
        config,
        session,
        metadata: {},
    };

    // TODO: use invokeLambda from @shared_modules
    await invokeLambda(REQUEST_PROCESSING_ARN, 'Event', payload);

    return { data: { data: Date.now() } };
}).use([
    inputOutputLogger({ omitPaths: ['event.body'], mask: '***omitted***' }),
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
