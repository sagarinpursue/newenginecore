export default {
    httpMethod: 'POST',
    path: `/public/chat_messages/rating`,
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        rating: 'upvote',
        chat_message_id: '00277c4b-5c59-4b3f-ac2a-1439eefec6eb',
    }),
};
