import { readFile } from 'fs/promises';

import Ajv from 'ajv';

let eventSchema;

async function loadSchema() {
    if (!eventSchema) {
        eventSchema = JSON.parse(await readFile(new URL('../schemas/event.json', import.meta.url)));
    }
}

const ajv = new Ajv({ coerceTypes: 'number', strictTypes: false, allowUnionTypes: true });

export default async function validateRequestEvent(body) {
    await loadSchema();

    if (!ajv.validate(eventSchema, body)) {
        console.error('AJV validation errors:', ajv.errors);
        throw new Error('Invalid input parameters.');
    }
}
