export default {
    httpMethod: 'PATCH',
    path: `/public/chat_messages/rating`,
    headers: {
        'Content-Type': 'application/json',
    },
    queryStringParameters: {
        chat_message_id: 'eq.00277c4b-5c59-4b3f-ac2a-1439eefec6eb',
    },
    body: JSON.stringify({
        rating: 'upvote',
    }),
};
