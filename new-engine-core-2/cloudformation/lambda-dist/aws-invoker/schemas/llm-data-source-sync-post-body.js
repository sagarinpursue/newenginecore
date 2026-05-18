export const llmDataSourceSyncPostBodySchema = {
    type: 'object',
    required: ['knowledgeBaseId', 'dataSourceId'],
    properties: {
        knowledgeBaseId: {
            type: 'string',
        },
        dataSourceId: {
            type: 'string',
        },
    },
};
