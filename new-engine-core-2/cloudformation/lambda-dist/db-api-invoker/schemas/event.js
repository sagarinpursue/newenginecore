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
        headers: {
            type: 'object',
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
                        type: ['object', 'array'],
                        errorMessage: 'Request payload should be a JSON object or array',
                    },
                },
            },
        },
    ],
    errorMessage: {
        required: {
            httpMethod: 'Method is required',
            path: 'Path is required',
        },
    },
};
