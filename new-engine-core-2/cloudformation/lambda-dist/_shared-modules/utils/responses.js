export const Responses = {
    emptySuccess: {
        statusCode: 200,
    },
    success: (data) => ({
        statusCode: 200,
        body: JSON.stringify(data),
    }),
    missingRequestParams: {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required parameter(s)' }),
    },
    serverError: (error) => ({
        statusCode: 500,
        body: JSON.stringify({ message: error.message || error }),
    }),
};
