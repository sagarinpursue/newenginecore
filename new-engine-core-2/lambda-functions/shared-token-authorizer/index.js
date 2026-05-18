import { readFile } from 'fs/promises';

import middy from '@middy/core';
import secretsManager from '@middy/secrets-manager';

import Ajv from 'ajv';

import LlmStructureSharedTokenDb from './db/llm-structure-shared-token-db.js';

// const eventSchema = (await import("./schemas/event.json", { assert: { type: "json" } })).default;
const eventSchema = JSON.parse(await readFile(new URL('./schemas/event.json', import.meta.url)));

// custom env vars
const DB_API_URL = process.env.DB_API_URL;
const JWT_AUTHORIZER_SECRET = process.env.JWT_AUTHORIZER_SECRET;

const ajv = new Ajv({ coerceTypes: 'number' });

export const handler = middy(async (event, context) => {
    console.log('event:', event);

    const llmStructureSharedTokenDb = new LlmStructureSharedTokenDb(DB_API_URL, context.jwtAuth.serviceRoleKey);

    if (!ajv.validate(eventSchema, event)) {
        console.error(ajv.errors);
        throw Error(ajv.errors);
    }

    const token = event.authorizationToken;
    console.log('token:', token);

    if (!token) {
        console.log('no token');
        return generatePolicy('user', 'Deny', event.methodArn);
    }

    try {
        const llmStructureId = await llmStructureSharedTokenDb.getLlmStructureId(token);
        console.log('llmStructureId:', llmStructureId);
        if (!llmStructureId) {
            return generatePolicy('Deny', event.methodArn);
        }
        const policy = generatePolicy('Allow', event.methodArn);
        policy.context = {
            llmStructureId,
        };
        return policy;
    } catch (error) {
        console.error('error:', error);
        return generatePolicy('Deny', event.methodArn);
    }
}).use([
    secretsManager({
        fetchData: {
            jwtAuth: JWT_AUTHORIZER_SECRET,
        },
        disablePrefetch: true,
        setToContext: true,
    }),
]);

const generatePolicy = (effect, resource) => {
    return {
        principalId: 'shared-token',
        policyDocument: {
            Version: '2012-10-17',
            Statement: [
                {
                    Action: 'execute-api:Invoke',
                    Effect: effect,
                    Resource: resource,
                },
            ],
        },
    };
};
