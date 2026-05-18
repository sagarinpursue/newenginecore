export const eventSchema = {
    type: 'object',
    required: ['httpMethod', 'path'],
    properties: {
        httpMethod: {
            type: 'string',
        },
        path: {
            type: 'string',
        },
    },
    allOf: [
        {
            if: {
                properties: {
                    httpMethod: {
                        enum: ['POST', 'PUT', 'PATCH'],
                    },
                },
            },
            then: {
                required: ['body'],
                properties: {
                    body: {
                        type: 'object',
                    },
                },
            },
        },
    ],
};
