export const cxAiAgentsActionGroupsPostBodySchema = {
    type: 'object',
    properties: {
        agentId: { type: 'string' },
        actionGroupName: { type: 'string' },
        description: { type: 'string', minLength: 1 },
        lambdaName: { type: 'string' },
        functions: {
            type: 'array',
            minItems: 1,
            items: {
                type: 'object',
                properties: {
                    name: { type: 'string' },
                    description: { type: 'string', minLength: 1 },
                    parameters: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                name: { type: 'string' },
                                description: { type: 'string', minLength: 1 },
                                type: { type: 'string' },
                            },
                            required: ['name', 'description', 'type'],
                        },
                    },
                },
                required: ['name', 'description'],
            },
        },
    },
    required: ['agentId', 'actionGroupName', 'description', 'lambdaName', 'functions'],
    additionalProperties: false,
};
