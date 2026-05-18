export const cxAiAgentsKnowledgeBasePostBody = {
    type: 'object',
    properties: {
        agentId: { type: 'string' },
        knowledgeBaseId: { type: 'string' },
        description: { type: 'string' },
    },
    required: ['agentId', 'knowledgeBaseId', 'description'],
    additionalProperties: false,
};
