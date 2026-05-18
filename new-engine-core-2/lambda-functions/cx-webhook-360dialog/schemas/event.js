export const eventSchema = {
    type: 'object',
    required: ['body'],
    properties: {
        body: {
            type: 'object',
            required: ['object', 'entry'],
            additionalProperties: true,
            properties: {
                object: { type: 'string', enum: ['whatsapp_business_account'] },
                entry: {
                    type: 'array',
                    minItems: 1,
                    items: {
                        type: 'object',
                        required: ['id', 'changes'],
                        properties: {
                            id: { type: 'string' },
                            changes: {
                                type: 'array',
                                minItems: 1,
                                items: {
                                    type: 'object',
                                    required: ['value', 'field'],
                                    properties: {
                                        field: { type: 'string', const: 'messages' },
                                        value: {
                                            type: 'object',
                                            required: ['metadata'],
                                            additionalProperties: true,
                                            properties: {
                                                messaging_product: { type: 'string', const: 'whatsapp' },
                                                metadata: { type: 'object' },
                                                messages: { type: 'array' },
                                                statuses: { type: 'array' },
                                                contacts: { type: 'array' },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    },
};
