export default {
    httpMethod: 'POST',
    path: `/reset-password`,
    headers: {
        'Content-Type': 'application/json',
    },
    queryStringParameters: {
        redirect_to: 'http://localhost:3000/reset-password',
    },
    body: JSON.stringify({
        email: 'vadim+llm@2lemetry.io',
    }),
};
