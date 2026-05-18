export const cxAiAgentsGetQuery = {
    type: 'object',
    properties: {
        agentId: { type: 'string' },
    },
    required: ['agentId'],
    additionalProperties: false,
};
