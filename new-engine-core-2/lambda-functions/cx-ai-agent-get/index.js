// Native and 3rd party Node modules
import middy from '@middy/core';
import inputOutputLogger from '@middy/input-output-logger';
import secretsManager from '@middy/secrets-manager';
import validator from '@middy/validator';

import Ajv from 'ajv';
import ajvErrors from 'ajv-errors';
import ajvFormats from 'ajv-formats';

// Custom Node modules
import { httpErrorFormatter, httpResponseFormatter } from '@shared-modules/f2-middlewares';

import { eventSchema } from './schemas/event.js';
import { get } from './services/cx-ai-agent.service.js';

// Custom env vars
const JWT_AUTHORIZER_SECRET = process.env.JWT_AUTHORIZER_SECRET;

// Create AJV instance and configure it with ajv-errors and ajv-formats
const ajv = new Ajv({ coerceTypes: 'number', strictTypes: false, allowUnionTypes: true, allErrors: true });
ajvFormats(ajv);
ajvErrors(ajv);

export const handler = middy(async (event, context) => {
    const token = event.headers.Authorization;
    const query = event.queryStringParameters;

    const agent = await get({
        dbApiKey: context.jwtAuth.anonKey,
        token,
        data: {
            aiAgentId: query.aiAgentId,
        },
    });

    return {
        data: agent,
    };
}).use([
    inputOutputLogger(),
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
