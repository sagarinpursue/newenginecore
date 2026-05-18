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
            required: ['documentsMetadata', 'uploadDescription'],
            properties: {
                uploadDescription: {
                    type: 'string',
                },
                documentsMetadata: {
                    type: 'array',
                    items: {
                        type: 'object',
                        required: ['documentId', 'documentName', 'documentType', 'documentSize'],
                        properties: {
                            documentId: { type: 'string' },
                            documentName: { type: 'string' },
                            documentType: { type: 'string' },
                            documentSize: { type: 'number' },
                        },
                    },
                },
            },
            additionalProperties: false,
        },
    },
    additionalProperties: true,
};
