// TODO: Need remove this util and use shared module middlewares for response formatting
export const Responses = {
    missingRequestParams: {
        statusCode: 400,
        headers: {
            'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Missing required parameter(s)' }),
    },
    success: (data) => ({
        statusCode: 200,
        body: JSON.stringify(data),
    }),
    serverError: (error) => ({
        statusCode: 500,
        body: JSON.stringify({ message: error.message || error }),
    }),
};
