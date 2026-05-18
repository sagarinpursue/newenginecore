export const eventSchema = {
    type: 'object',
    required: ['body'],
    properties: {
        body: {
            type: 'object',
            required: ['chunksPerQuestion', 'reportId'],
            properties: {
                chunksPerQuestion: { type: 'number' },
                reportId: { type: 'string' },
            },
            additionalProperties: false,
        },
    },
    additionalProperties: false,
};
