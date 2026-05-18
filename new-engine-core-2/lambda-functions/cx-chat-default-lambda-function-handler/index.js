import middy from '@middy/core';
import inputOutputLogger from '@middy/input-output-logger';
import validator from '@middy/validator';

import Ajv from 'ajv';
import ajvErrors from 'ajv-errors';
import ajvFormats from 'ajv-formats';

// Custom Node modules
import { eventSchema } from './schemas/event.js';

// Create AJV instance and configure it with ajv-errors and ajv-formats
const ajv = new Ajv({ coerceTypes: 'number', strictTypes: false, allowUnionTypes: true, allErrors: true });
ajvFormats(ajv);
ajvErrors(ajv);

export const handler = middy(async () => {
    return {
        data: {
            messageText: 'I do not know',
        },
    };
}).use([inputOutputLogger(), validator({ eventSchema: ajv.compile(eventSchema) })]);
