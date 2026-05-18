export const eventSchema = {
    type: 'object',
    required: ['body'],
    properties: {
        body: {
            type: 'object',
            required: ['sessionId'],
            properties: {
                sessionId: { type: 'string' },
            },
            additionalProperties: false,
        },
    },
    additionalProperties: true,
};
