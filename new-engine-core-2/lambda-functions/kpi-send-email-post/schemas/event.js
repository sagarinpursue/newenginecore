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
            required: ['notificationType'],
            properties: {
                notificationType: {
                    type: 'string',
                    enum: ['reminderMissedServices'],
                },
            },
            anyOf: [
                {
                    if: { properties: { notificationType: { const: 'reminderMissedServices' } } },
                    then: {
                        required: ['reportId'],
                        properties: { reportId: { type: 'string' } },
                    },
                },
            ],
        },
    },
};
