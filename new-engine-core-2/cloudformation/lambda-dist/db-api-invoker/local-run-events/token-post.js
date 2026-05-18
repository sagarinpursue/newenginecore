export default {
    httpMethod: 'POST',
    path: `/token`,
    headers: {
        'Content-Type': 'application/json',
    },
    queryStringParameters: {
        grant_type: 'password',
    },
    body: JSON.stringify({
        email: 'vadim+llm@2lemetry.io',
        password: '1qaz@WSX',
    }),
};
