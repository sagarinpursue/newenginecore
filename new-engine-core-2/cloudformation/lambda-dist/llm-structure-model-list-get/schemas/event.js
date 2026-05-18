export const eventSchema = {
    type: 'object',
    properties: {
        queryStringParameters: {
            type: 'object',
            properties: {
                family: {
                    type: 'string',
                },
            },
            nullable: true,
        },
    },
};
