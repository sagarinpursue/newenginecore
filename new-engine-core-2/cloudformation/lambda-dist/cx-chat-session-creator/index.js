import middy from '@middy/core';
import httpJsonBodyParser from '@middy/http-json-body-parser';
import inputOutputLogger from '@middy/input-output-logger';
import secretsManager from '@middy/secrets-manager';
import validator from '@middy/validator';

import Ajv from 'ajv';
import ajvErrors from 'ajv-errors';
import ajvFormats from 'ajv-formats';

// Custom Node modules
import { RpcDbApi, ChatbotSessionDbApi, CxChannelQuestionDbApi } from '@shared-modules/f2-db-api';
import { httpErrorFormatter, httpResponseFormatter } from '@shared-modules/f2-middlewares';
import { createQueueForPolling } from '@shared-modules/f2-utils';

import { eventSchema } from './schemas/event.js';

// Env variables
const DB_API_URL = process.env.DB_API_URL;
const JWT_AUTHORIZER_SECRET = process.env.JWT_AUTHORIZER_SECRET;

// Create AJV instance and configure it with ajv-errors and ajv-formats
const ajv = new Ajv({ coerceTypes: 'number', strictTypes: false, allowUnionTypes: true, allErrors: true });
ajvFormats(ajv);
ajvErrors(ajv);

export const handler = middy(async (event, context) => {
    console.log('event:', event);

    // DB clients
    const rpcDb = new RpcDbApi(DB_API_URL, context.jwtAuth.serviceRoleKey);
    const chatbotSessionDb = new ChatbotSessionDbApi(
        DB_API_URL,
        context.jwtAuth.serviceRoleKey,
        `Bearer ${context.jwtAuth.serviceRoleKey}`
    );
    const cxChannelQuestionDb = new CxChannelQuestionDbApi(
        DB_API_URL,
        context.jwtAuth.serviceRoleKey,
        `Bearer ${context.jwtAuth.serviceRoleKey}`
    );

    const { channelId, sessionId } = event.body;

    const config = await rpcDb.getChatConfig(channelId);

    const payload = {
        chatId: config.chatId,
        sessionId: sessionId,
        channelId: channelId,
        accountId: config.accountId,
    };

    await chatbotSessionDb.createSession(payload);

    try {
        await createQueueForPolling(sessionId);
    } catch (e) {
        console.error('Error while creating polling queue:', e);
    }

    let questions = [];

    try {
        questions = await cxChannelQuestionDb.getActiveQuestions(channelId);
    } catch (e) {
        console.error('Error while getting predefined questions:', e);
    }

    return { data: questions };
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
