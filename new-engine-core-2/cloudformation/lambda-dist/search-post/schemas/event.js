export const eventSchema = {
    type: 'object',
    required: ['body'],
    properties: {
        body: {
            type: 'object',
            required: ['resourceType'],
            properties: {
                resourceType: {
                    type: 'string',
                },
                page: {
                    type: 'number',
                    minimum: 1,
                },
                offset: {
                    type: 'number',
                    minimum: 0,
                },
                pageSize: {
                    type: 'number',
                    minimum: 1,
                },
                limit: {
                    type: 'number',
                    minimum: 1,
                },
                sortBy: {
                    type: 'string',
                },
                sortOrder: {
                    type: 'string',
                    enum: ['asc', 'desc'],
                },
                searchBy: {
                    type: 'array',
                    items: {
                        type: 'string',
                    },
                    minItems: 1,
                },
                searchString: {
                    type: 'string',
                },
                createdFrom: {
                    type: 'string',
                },
                createdTo: {
                    type: 'string',
                },
                filter: {
                    type: 'object',
                },
            },
        },
    },
};
