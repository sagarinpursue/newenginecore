export const cxAiAgentsCollaboratorDeleteQuery = {
    type: 'object',
    properties: {
        agentId: { type: 'string' },
        collaboratorId: { type: 'string' },
    },
    required: ['agentId', 'collaboratorId'],
    additionalProperties: false,
};
