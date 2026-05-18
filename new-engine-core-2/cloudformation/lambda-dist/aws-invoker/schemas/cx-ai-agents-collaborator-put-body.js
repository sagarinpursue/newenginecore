export const cxAiAgentsCollaboratorPutBody = {
    type: 'object',
    properties: {
        agentId: { type: 'string' },
        collaboratorId: { type: 'string' },
        collaboratorAgentId: { type: 'string' },
        collaboratorAgentAliasId: { type: 'string' },
        collaboratorName: { type: 'string' },
        collaborationInstruction: { type: 'string' },
    },
    required: [
        'agentId',
        'collaboratorId',
        'collaboratorAgentId',
        'collaboratorAgentAliasId',
        'collaboratorName',
        'collaborationInstruction',
    ],
    additionalProperties: false,
};
