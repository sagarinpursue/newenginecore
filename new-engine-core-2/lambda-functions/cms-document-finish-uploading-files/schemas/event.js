export const eventSchema = {
    type: 'object',
    required: ['headers', 'body'],
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
        body: {
            type: 'object',
            required: ['destinationFolder'],
            properties: {
                destinationFolder: {
                    type: 'string',
                },
                documents: {
                    type: 'array',
                    items: {
                        type: 'object',
                        required: ['documentId', 'documentName'],
                        properties: {
                            documentId: { type: 'string' },
                            documentName: { type: 'string' },
                        },
                    },
                },
            },
            additionalProperties: false,
        },
    },
    additionalProperties: true,
};
