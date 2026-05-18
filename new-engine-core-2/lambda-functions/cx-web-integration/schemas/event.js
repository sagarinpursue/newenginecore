export const eventSchema = {
    type: 'object',
    required: ['body'],
    properties: {
        body: {
            type: 'object',
            required: ['input', 'sessionId', 'channelId'],
            properties: {
                input: { type: 'string' },
                channelId: { type: 'string' },
                sessionId: { type: 'string' },
            },
            additionalProperties: false,
        },
    },
    additionalProperties: true,
};
