export const eventSchema = {
    type: 'object',
    required: ['queryStringParameters'],
    properties: {
        queryStringParameters: {
            type: 'object',
            required: ['channelId'],
            properties: {
                channelId: {
                    type: 'string',
                },
            },
        },
    },
};
