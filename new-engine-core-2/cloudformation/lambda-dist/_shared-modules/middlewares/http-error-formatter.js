export const httpErrorFormatter = () => ({
    onError: async (request) => {
        const { error } = request;

        // console.error('httpErrorFormatter -> error:', error);
        console.error('httpErrorFormatter -> error.name:', error?.name);
        console.error('httpErrorFormatter -> error.message:', error?.message);
        console.error('httpErrorFormatter -> error.cause.data:', error?.cause?.data);
        console.error('httpErrorFormatter -> error.response.data:', error?.response?.data);

        const headers = request.response?.headers || {};

        headers['Access-Control-Allow-Origin'] = '*';

        // Handle input validation errors
        if (error?.name === 'BadRequestError') {
            console.error('httpErrorFormatter -> Validator Error');

            // Parse errors raised by middy validator
            // const messages = error?.cause?.data
            //     ?.map((e) => e.message)
            //     ?.filter(Boolean) || [];

            request.response = {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    error: {
                        code: 'INVALID_INPUT',
                        message:
                            'The data provided does not meet the required conditions. Please review your input and try again.',
                    },
                }),
            };
            return;
        }

        // Handle unsupported media type (415)
        if (error?.name === 'UnsupportedMediaTypeError') {
            console.error('httpErrorFormatter -> HTTP JSON Body Parser Error');
            request.response = {
                statusCode: 415,
                headers,
                body: JSON.stringify({
                    error: {
                        code: 'UNSUPPORTED_MEDIA_TYPE',
                        message: error?.message,
                    },
                }),
            };
            return;
        }

        // Auth errors
        if (error?.response?.data?.msg && error?.response?.status) {
            console.error('httpErrorFormatter -> Auth Error');
            const { msg } = error.response.data;
            const status = error.response.status;
            request.response = {
                statusCode: status,
                headers,
                body: JSON.stringify({
                    error: {
                        code: 'BAD_REQUEST_ERROR',
                        message: msg,
                    },
                }),
            };
            return;
        }

        // Handle DB API errors
        if (error?.response?.data?.message && error?.response?.status) {
            console.error('httpErrorFormatter -> DB API Error');

            const { message: pgMsg, code: pgCode } = error.response.data;
            const status = error.response.status;
            const statusText = error.response.statusText;

            switch (pgCode) {
                case '21000': // Cardinality Violation
                case '23514': // Check violation
                    request.response = {
                        statusCode: status,
                        headers,
                        body: JSON.stringify({
                            error: {
                                code: 'BAD_REQUEST_ERROR',
                                message:
                                    'An error occurred while processing your request. Please ensure all required conditions are specified and try again.',
                            },
                        }),
                    };
                    break;
                case '22007': // Invalid Date format
                case '22P02': // Invalid Text Representation
                    request.response = {
                        statusCode: status,
                        headers,
                        body: JSON.stringify({
                            error: {
                                code: 'BAD_REQUEST_ERROR',
                                message: pgMsg,
                            },
                        }),
                    };
                    break;
                case '23502': // Not null violation
                case '23503': // Foreign key violation
                case '42P01': // Undefined table
                    request.response = {
                        statusCode: status,
                        headers,
                        body: JSON.stringify({
                            error: {
                                code: 'BAD_REQUEST_ERROR',
                                message:
                                    'The data provided does not meet the required conditions. Please review your input and try again.',
                            },
                        }),
                    };
                    break;
                case '23505': // Unique violation
                    request.response = {
                        statusCode: status,
                        headers,
                        body: JSON.stringify({
                            error: {
                                code: 'DUPLICATE_ERROR',
                                message: 'Already exists', // TODO: need better text
                            },
                        }),
                    };
                    break;
                case '28000': // Invalid authorization specification (Authentication failure)
                case 'PGRST301': // Any error related to the verification of the JWT, which means that the JWT provided is invalid in some way.
                    request.response = {
                        statusCode: status,
                        headers,
                        body: JSON.stringify({
                            error: {
                                code: 'AUTH_ERROR',
                                message: 'Unauthorized', // TODO: need better text,
                            },
                        }),
                    };
                    break;
                case '42501': // Permission denied
                case 'F0806': // RLS (Row-Level Security) violation
                    request.response = {
                        statusCode: status,
                        headers,
                        body: JSON.stringify({
                            error: {
                                code: 'ACCESS_DENIED_ERROR',
                                message: 'Access denied. You do not have permission to perform this action',
                            },
                        }),
                    };
                    break;
                default:
                    request.response = {
                        statusCode: status,
                        headers,
                        body: JSON.stringify({
                            error: {
                                code: 'DB_ERROR',
                                message: statusText,
                            },
                        }),
                    };
            }
            return;
        }

        // Default fallback for any unhandled errors
        console.error('httpErrorFormatter -> Unhandled Error');
        request.response = {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'An error occurred. Please try again or contact support if the problem persists',
                },
            }),
        };
    },
});
