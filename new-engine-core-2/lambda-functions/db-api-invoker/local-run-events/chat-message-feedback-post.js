export default {
    httpMethod: 'POST',
    path: `/public/chat_messages/feedback`,
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        feedback_text: 'some text',
        feedback_reason: 'Other',
        chat_message_id: '3327df1f-4261-4575-8285-a9e985ffe2f0',
    }),
};
