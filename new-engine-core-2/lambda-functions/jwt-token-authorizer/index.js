import { readFile } from 'fs/promises';

import jwt from 'jsonwebtoken';

import middy from '@middy/core';
import inputOutputLogger from '@middy/input-output-logger';
import secretsManager from '@middy/secrets-manager';

import Ajv from 'ajv';

// const eventSchema = (await import("./schemas/event.json", { assert: { type: "json" } })).default;
const eventSchema = JSON.parse(await readFile(new URL('./schemas/event.json', import.meta.url)));

// custom env vars
const JWT_AUTHORIZER_SECRET = process.env.JWT_AUTHORIZER_SECRET;

const ajv = new Ajv({ coerceTypes: 'number' });

export const handler = middy(async (event, context) => {
    if (!ajv.validate(eventSchema, event)) {
        console.error(ajv.errors);
        throw Error(ajv.errors);
    }

    const token = event.authorizationToken?.replace('Bearer ', '');
    console.log('token:', token);

    if (!token) {
        console.log('no token');
        return generatePolicy('user', 'Deny', event.methodArn);
    }

    try {
        const decoded = jwt.verify(token, context.jwtAuth.jwtSecret);
        console.log('decoded:', decoded);
        return generatePolicy('Allow', event.methodArn);
    } catch (error) {
        console.error('error:', error);
        return generatePolicy('Deny', event.methodArn);
    }
}).use([
    inputOutputLogger(),
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
        principalId: 'jwt',
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
