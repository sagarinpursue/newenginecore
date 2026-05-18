export default {
    httpMethod: 'POST',
    path: `/public/chat_sessions/feedback`,
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        feedback_text: 'some text',
        chat_session_id: 'eca31d30-5ec6-4d1c-ab3c-111401a0098c',
    }),
};
