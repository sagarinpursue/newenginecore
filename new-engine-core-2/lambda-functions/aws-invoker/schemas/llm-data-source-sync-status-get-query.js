export const llmDataSourceSyncStatusGetQuerySchema = {
    type: 'object',
    required: ['knowledgeBaseId', 'dataSourceId', 'ingestionJobId'],
    properties: {
        knowledgeBaseId: {
            type: 'string',
        },
        dataSourceId: {
            type: 'string',
        },
        ingestionJobId: {
            type: 'string',
        },
    },
};
