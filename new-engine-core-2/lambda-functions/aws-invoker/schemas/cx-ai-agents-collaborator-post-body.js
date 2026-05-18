export const cxAiAgentsCollaboratorPostBody = {
    type: 'object',
    properties: {
        agentId: { type: 'string' },
        collaboratorAgentId: { type: 'string' },
        collaboratorAgentAliasId: { type: 'string' },
        collaboratorName: { type: 'string' },
        collaborationInstruction: { type: 'string' },
    },
    required: ['agentId', 'collaboratorAgentId', 'collaboratorAgentAliasId', 'collaboratorName', 'collaborationInstruction'],
    additionalProperties: false,
};
