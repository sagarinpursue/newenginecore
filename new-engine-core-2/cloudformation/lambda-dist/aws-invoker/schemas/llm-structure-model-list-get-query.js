export const llmStructureModelListGetQuerySchema = {
    type: 'object',
    required: [],
    properties: {
        byProvider: {
            type: 'string',
        },
        byCustomizationType: {
            type: 'string',
        },
        byOutputModality: {
            type: 'string',
        },
        byInferenceType: {
            type: 'string',
        },
    },
};
