import { Responses } from './responses.js';

export const validateEvent = (event) => {
    if (event.parameters) {
        return null;
    }

    if (!event.sessionId || !event.localeId || !event.config) {
        return Responses.invalidRequestParams;
    }

    return null;
};

export const extractEventData = (event) => {
    if (!event.parameters) {
        return {
            user: {},
            config: {
                ...event.config,
                localeId: event.localeId,
                sessionId: event.sessionId,
            },
        };
    }

    const params = event.parameters;
    const promptSessionAttributes = event.promptSessionAttributes;

    const data = {
        user: {},
        config: {},
    };

    for (const param of params) {
        data.user[param.name] = param.value;
    }

    for (const attribute in promptSessionAttributes) {
        data.config[attribute] = promptSessionAttributes[attribute];
    }

    return data;
};
