export const eventSchema = {
    type: 'object',
    required: ['body'],
    properties: {
        body: {
            type: 'object',
            properties: {
                name: {
                    type: 'string',
                    pattern: '^[a-z0-9_-]+$',
                },
                channel: {
                    enum: ['web', 'custom', '360dialog'],
                },
                chatId: {
                    type: 'string',
                },
                channelId: {
                    type: 'string',
                },
                vendorLabel: {
                    type: 'string',
                },
                vendorId: {
                    type: 'string',
                },
                vendorSecret: {
                    type: 'string',
                },
                vendorAuth: {
                    type: 'string',
                },
            },
            oneOf: [
                {
                    required: ['channelId', 'chatId'],
                },
                {
                    required: ['name', 'channel', 'chatId'],
                    not: {
                        required: ['channelId'],
                    },
                },
            ],
        },
    },
};
