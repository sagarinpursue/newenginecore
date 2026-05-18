export default {
    httpMethod: 'POST',
    path: `/token`,
    headers: {
        'Content-Type': 'application/json',
    },
    queryStringParameters: {
        grant_type: 'refresh_token',
    },
    body: JSON.stringify({
        refresh_token: 'vcrfoWhZuGkszP4jgKUlnw',
    }),
};
