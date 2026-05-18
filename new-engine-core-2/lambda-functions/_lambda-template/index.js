import createError from 'http-errors';

import middy from '@middy/core';
import httpJsonBodyParser from '@middy/http-json-body-parser';
import validator from '@middy/validator';

import Ajv from 'ajv';
import ajvErrors from 'ajv-errors';
import ajvFormats from 'ajv-formats';

// Custom Node modules
import { httpErrorFormatter, httpResponseFormatter } from '@shared-modules/f2-middlewares';

import { eventSchema } from './schemas/event.js';

// Env variables
// const DB_API_URL = process.env.DB_API_URL;
// const DB_API_KEY = process.env.DB_API_KEY;
// const AWS_REGION = process.env.AWS_REGION;

// Create AJV instance and configure it with ajv-errors and ajv-formats
const ajv = new Ajv({ coerceTypes: 'number', strictTypes: false, allowUnionTypes: true, allErrors: true });
ajvFormats(ajv);
ajvErrors(ajv);

// AWS clients

export const handler = middy(async (event) => {
    console.log('event:', event);

    if (!ajv.validate(eventSchema, event)) {
        console.error('validate body:', ajv.errors);
        const error = createError.BadRequest();
        error.cause = { data: ajv.errors };
        throw error;
    }

    return { data: 'Lambda function successfully invoked' };
}).use([
    httpJsonBodyParser({
        disableContentTypeError: true,
    }),
    validator({ eventSchema: ajv.compile(eventSchema) }),
    httpResponseFormatter(),
    httpErrorFormatter(),
]);
