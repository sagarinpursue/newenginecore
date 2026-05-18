export const eventSchema = {
    type: 'object',
    required: ['body'],
    properties: {
        body: {
            type: 'object',
            required: ['channelId', 'sessionId'],
            properties: {
                channelId: { type: 'string' },
                sessionId: { type: 'string' },
            },
            additionalProperties: false,
        },
    },
    additionalProperties: true,
};
