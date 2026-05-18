import jwt from 'jsonwebtoken';

import middy from '@middy/core';
import httpJsonBodyParser from '@middy/http-json-body-parser';
import inputOutputLogger from '@middy/input-output-logger';
import secretsManager from '@middy/secrets-manager';
import validator from '@middy/validator';

import Ajv from 'ajv';
import ajvErrors from 'ajv-errors';
import ajvFormats from 'ajv-formats';

import { httpErrorFormatter, httpResponseFormatter } from '@shared-modules/f2-middlewares';

import { eventSchema } from './schemas/event.js';

const JWT_AUTHORIZER_SECRET = process.env.JWT_AUTHORIZER_SECRET;
const WEBSOCKET_URL = process.env.WEBSOCKET_URL;

const ajv = new Ajv({ coerceTypes: 'number', strictTypes: false, allowUnionTypes: true, allErrors: true });
ajvFormats(ajv);
ajvErrors(ajv);

export const handler = middy(async (event, context) => {
    const { sessionId } = event.body;

    try {
        const token = jwt.sign({ sessionId }, context.jwtAuth.jwtSecret, { expiresIn: 60 });

        const payload = { wsUrl: `wss://${WEBSOCKET_URL}`, token };

        return { data: payload };
    } catch (error) {
        console.error('Token Generation Failed:', error);
        throw new Error('Internal Server Error');
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
