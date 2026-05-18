export const eventSchema = {
    type: 'object',
    required: ['headers', 'body'],
    properties: {
        headers: {
            type: 'object',
            required: ['Authorization'],
            properties: {
                Authorization: {
                    type: 'string',
                },
            },
        },
        body: {
            type: 'object',
            required: ['aiAgentId', 'agentId'],
            properties: {
                aiAgentId: {
                    type: 'string',
                },
                agentId: {
                    type: 'string',
                },
                agentAliasId: {
                    type: 'string',
                },
                name: {
                    type: 'string',
                },
                model: {
                    type: 'string',
                },
                instruction: {
                    type: 'string',
                },
                agentCollaboration: {
                    type: 'string',
                },
                update: {
                    type: 'boolean',
                },
                prepare: {
                    type: 'boolean',
                },
                deploy: {
                    type: 'boolean',
                },
            },
            anyOf: [{ required: ['update'] }, { required: ['prepare'] }, { required: ['deploy'] }],
            allOf: [
                {
                    if: {
                        properties: { update: { const: true } },
                        required: ['update'],
                    },
                    then: {
                        required: ['name', 'model', 'instruction', 'agentCollaboration'],
                    },
                },
                {
                    if: {
                        properties: { deploy: { const: true } },
                        required: ['deploy'],
                    },
                    then: {
                        required: ['agentAliasId'],
                    },
                },
            ],
        },
    },
};
