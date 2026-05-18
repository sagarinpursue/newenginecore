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
            oneOf: [
                { required: ['name', 'model', 'instruction', 'agentCollaboration'] },
                { required: ['name', 'agentId', 'agentAliasId'] },
            ],
            properties: {
                name: {
                    type: 'string',
                },
                model: {
                    type: 'string',
                },
                instruction: {
                    type: 'string',
                },
                agentId: {
                    type: 'string',
                },
                agentAliasId: {
                    type: 'string',
                },
                agentCollaboration: {
                    type: 'string',
                },
            },
        },
    },
};
