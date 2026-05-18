// responses.js

export const Responses = {
    invalidRequestParams: {
        statusCode: 400,
        headers: {
            'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Invalid Request Params.' }),
    },
    noRecords: {
        statusCode: 400,
        headers: {
            'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'No records.' }),
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
