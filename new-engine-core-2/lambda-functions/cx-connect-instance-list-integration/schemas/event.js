export const eventSchema = {
    type: 'object',
    required: ['headers'],
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
    },
    additionalProperties: true,
};
