export const eventSchema = {
    type: 'object',
    required: ['headers', 'queryStringParameters'],
    properties: {
        headers: {
            type: 'object',
            required: ['Authorization'],
            properties: {
                Authorization: {
                    type: 'string',
                },
            },
        },
        queryStringParameters: {
            type: 'object',
            properties: {
                aiAgentId: {
                    type: 'string',
                },
            },
        },
    },
};
