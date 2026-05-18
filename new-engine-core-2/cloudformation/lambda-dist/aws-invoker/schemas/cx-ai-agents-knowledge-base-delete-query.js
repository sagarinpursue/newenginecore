export const cxAiAgentsKnowledgeBaseDeleteQuery = {
    type: 'object',
    properties: {
        agentId: { type: 'string' },
        knowledgeBaseId: { type: 'string' },
    },
    required: ['agentId', 'knowledgeBaseId'],
    additionalProperties: false,
};
