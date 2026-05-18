export const eventSchema = {
    type: 'object',
    required: ['queryStringParameters'],
    properties: {
        queryStringParameters: {
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
