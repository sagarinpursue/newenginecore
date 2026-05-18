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
            required: ['name'],
            properties: {
                name: {
                    type: 'string',
                    pattern: '^[a-z0-9-]{3,63}$',
                },
                chunkingStrategy: {
                    type: 'string',
                },
                chunkSize: {
                    type: 'number',
                },
                embeddingModels: {
                    type: 'string',
                },
                sourceType: {
                    enum: ['S3', 'WEB'],
                },
                s3Folder: {
                    type: 'string',
                },
                url: {
                    type: 'string',
                },
                destinationType: {
                    enum: ['S3', 'OpenSearch'],
                },
                knowledgeBaseId: {
                    type: 'string',
                },
            },
            oneOf: [
                // Either knowledgeBaseId is provided
                {
                    required: ['knowledgeBaseId'],
                },
                // Or all of chunkingStrategy, embeddingModels, and sourceType are provided
                {
                    required: ['chunkingStrategy', 'embeddingModels', 'sourceType', 'destinationType'],
                    allOf: [
                        // If sourceType is S3, then s3Folder is required
                        {
                            if: {
                                properties: { sourceType: { const: 'S3' } },
                            },
                            then: {
                                required: ['s3Folder'],
                            },
                        },
                        // If sourceType is WEB, then url is required
                        {
                            if: {
                                properties: { sourceType: { const: 'WEB' } },
                            },
                            then: {
                                required: ['url'],
                            },
                        },
                    ],
                },
            ],
        },
    },
};
