export const cxAiAgentsKnowledgeBaseListGetQuery = {
    type: 'object',
    properties: {
        agentId: { type: 'string' },
    },
    required: ['agentId'],
    additionalProperties: false,
};
