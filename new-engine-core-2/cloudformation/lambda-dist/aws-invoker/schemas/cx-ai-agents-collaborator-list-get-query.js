export const cxAiAgentsCollaboratorListGetQuery = {
    type: 'object',
    properties: {
        agentId: { type: 'string' },
    },
    required: ['agentId'],
    additionalProperties: false,
};
