export const cxAiAgentsActionGroupsDeleteQuerySchema = {
    type: 'object',
    properties: {
        agentId: { type: 'string' },
        actionGroupId: { type: 'string' },
    },
    required: ['agentId', 'actionGroupId'],
    additionalProperties: false,
};
