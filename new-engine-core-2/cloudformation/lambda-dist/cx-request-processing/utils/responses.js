export const Responses = {
    missingRequestParams: {
        statusCode: 400,
        headers: {
            'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Missing required parameter(s)' }),
    },
    success: {
        statusCode: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify('Request processed successfully'),
    },
    serverError: (error) => ({
        statusCode: 500,
        headers: {
            'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ message: error.message || error }),
    }),
};
