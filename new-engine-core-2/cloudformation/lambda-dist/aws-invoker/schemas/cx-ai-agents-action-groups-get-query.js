export const cxAiAgentsActionGroupsGetQuerySchema = {
    type: 'object',
    properties: {
        agentId: { type: 'string' },
        agentVersion: { type: 'string' },
        actionGroupId: { type: 'string' },
    },
    required: ['agentId', 'agentVersion', 'actionGroupId'],
    additionalProperties: false,
};
