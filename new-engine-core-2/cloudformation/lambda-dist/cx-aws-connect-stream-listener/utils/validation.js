import { Responses } from './responses.js';

export function validateRequestEvent(event = {}) {
    const requiredParams = ['Records'];
    if (!requiredParams.every((param) => Object.hasOwn(event, param))) {
        return Responses.invalidRequestParams;
    }

    const { Records } = event;

    if (!Array.isArray(Records)) {
        return Responses.invalidRequestParams;
    }

    if (Records.length === 0) {
        return Responses.noRecords;
    }

    return null; // Return null if validation passes
}
