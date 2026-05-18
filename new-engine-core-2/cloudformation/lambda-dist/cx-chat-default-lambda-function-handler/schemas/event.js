export const eventSchema = {
    type: 'object',
    properties: {
        input: {
            type: 'string',
        },
        sessionId: {
            type: 'string',
        },
        localeId: {
            type: 'string',
        },
        config: {
            type: 'object',
        },
    },
};
