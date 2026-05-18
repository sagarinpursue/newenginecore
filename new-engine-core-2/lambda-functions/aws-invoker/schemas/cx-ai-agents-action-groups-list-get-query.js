export const cxAiAgentsActionGroupsListGetQuerySchema = {
    type: 'object',
    properties: {
        agentId: { type: 'string' },
        agentVersion: { type: 'string' },
    },
    required: ['agentId', 'agentVersion'],
    additionalProperties: false,
};
