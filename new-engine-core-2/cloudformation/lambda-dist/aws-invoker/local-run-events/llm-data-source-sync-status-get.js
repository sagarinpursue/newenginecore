export default {
    httpMethod: 'GET',
    path: `/llm-data-source/sync/status`,
    queryStringParameters: {
        knowledgeBaseId: 'test-001',
        dataSourceId: 'test-001',
        ingestionJobId: 'test-001',
    },
};
