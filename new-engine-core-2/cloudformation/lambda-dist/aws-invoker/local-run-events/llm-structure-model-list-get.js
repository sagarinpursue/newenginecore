export default {
    httpMethod: 'GET',
    path: `/llm-structure/model/list`,
    queryStringParameters: {
        byProvider: 'Anthropic',
        byOutputModality: 'TEXT',
    },
};
