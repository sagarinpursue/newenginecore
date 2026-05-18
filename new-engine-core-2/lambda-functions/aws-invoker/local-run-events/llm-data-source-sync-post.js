export default {
    httpMethod: 'POST',
    path: `/llm-data-source/sync`,
    body: JSON.stringify({
        knowledgeBaseId: 'test-001',
        dataSourceId: 'test-001',
    }),
};
