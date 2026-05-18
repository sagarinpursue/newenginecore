export const eventSchema = {
    type: 'object',
    required: ['body'],
    properties: {
        body: {
            type: 'object',
            required: ['bucketUri', 'questionsPerDocument', 'llmStructureId', 'reportId'],
            properties: {
                bucketUri: { type: 'string' },
                questionsPerDocument: { type: 'number' },
                llmStructureId: { type: 'string' },
                reportId: { type: 'string' },
            },
            additionalProperties: false,
        },
    },
    additionalProperties: false,
};
