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
            required: ['email', 'password', 'userRole', 'fullName', 'phoneNumber', 'userAccountId'],
            properties: {
                email: { type: 'string' },
                password: { type: 'string' },
                userRole: { type: 'string' },
                fullName: { type: 'string' },
                phoneNumber: { type: 'string' },
                userAccountId: { type: 'string' },
            },
        },
    },
    additionalProperties: true,
};
