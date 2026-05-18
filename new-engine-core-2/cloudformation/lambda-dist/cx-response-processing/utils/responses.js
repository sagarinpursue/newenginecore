// responses.js

export const Responses = {
    invalidRequestParams: {
        statusCode: 400,
        headers: {
            'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Missing messageText or sessionId' }),
    },
    success: (data) => ({
        statusCode: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify(data),
    }),
    serverError: (error) => ({
        statusCode: 500,
        headers: {
            'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ message: error.message || error }),
    }),
};
