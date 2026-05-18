import { readFile } from 'fs/promises';

import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

import middy from '@middy/core';
import httpJsonBodyParser from '@middy/http-json-body-parser';
import inputOutputLogger from '@middy/input-output-logger';
import secretsManager from '@middy/secrets-manager';
import validator from '@middy/validator';

import Ajv from 'ajv';

import { httpErrorFormatter, httpResponseFormatter } from '@shared-modules/f2-middlewares';

import LlmStructureDb from './db/llm-structure-db.js';

// const eventSchema = (await import("./schemas/event.json", { assert: { type: "json" } })).default;
const eventSchema = JSON.parse(await readFile(new URL('./schemas/event.json', import.meta.url)));

// system env vars
const REGION = process.env.AWS_REGION;

// custom env vars
const APP_NAME = process.env.APP_NAME;
const ENV = process.env.ENV;
const DB_API_URL = process.env.DB_API_URL;
const JWT_AUTHORIZER_SECRET = process.env.JWT_AUTHORIZER_SECRET;

const ajv = new Ajv({ coerceTypes: 'number' });
const lambdaClient = new LambdaClient({ region: REGION });

export const handler = middy(async (event, context) => {
    console.log('event:', event);

    const body = event.body;
    const requestContext = event.requestContext || {};

    // Check requested resource equals to resource returned by Authorizer (applicable for Shared Token)
    if (requestContext.authorizer?.llmStructureId && body.llmStructureId !== requestContext.authorizer.llmStructureId) {
        throw new Error('Access denied');
    }

    // This lambda can be called by 3 ways:
    // 1. Via API Gateway using JWT
    // 2. Via API Gateway using Shared Token
    // 3. Directly by Backend
    // Auth info is used for proper DB API calls
    // - If JWT Auth, then DB API called by auth user (ANON API key + JWT)
    // - Otherwise, DB API called by service role user (SERVICE ROLE API key)
    const auth = {
        token: event.headers.Authorization || event.headers['X-Shared-Token'],
        isJwt: !!event.headers.Authorization,
    };
    const dbApiKey = auth.isJwt ? context.jwtAuth.anonKey : context.jwtAuth.serviceRoleKey;
    const token = auth.isJwt ? auth.token : `Bearer ${context.jwtAuth.serviceRoleKey}`;
    const llmStructureDb = new LlmStructureDb(DB_API_URL, dbApiKey, token);

    const structure = await llmStructureDb.get(body.llmStructureId);
    console.log('structure:', structure);

    let lambdaName;
    switch (structure.framework) {
        // TODO: add other supported frameworks
        case 'no-framework':
        default:
            lambdaName = `${APP_NAME}-llm-structure-no-framework-processing-${ENV}`;
    }

    const result = await lambdaClient.send(
        new InvokeCommand({
            FunctionName: lambdaName,
            Payload: JSON.stringify({
                llmStructureId: body.llmStructureId,
                prompt: body.message || '',
                eventTopic: body.topic,
                sessionId: body.sessionId,
                context: body.context,

                auth, // pass auth info to next processing lambdas
            }),
            InvocationType: 'RequestResponse',
        })
    );
    const resultPayload = new TextDecoder().decode(result.Payload);
    console.log('resultPayload:', resultPayload);

    return { data: JSON.parse(resultPayload) };
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
