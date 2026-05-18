export default {
    httpMethod: 'POST',
    path: `/public/chat_sessions/rating`,
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        rating: '5',
        chat_session_id: '01f293eb-4d0f-1631-4924-be1b3955fc18',
    }),
};
