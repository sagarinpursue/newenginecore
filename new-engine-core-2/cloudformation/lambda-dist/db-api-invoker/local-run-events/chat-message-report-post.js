export default {
    httpMethod: 'POST',
    path: `/public/chat_messages/report`,
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        report_details: 'test 2',
        report_reason: 'test 2',
        chat_message_id: '0062ffca-144e-4975-90d9-7349d87a4ed3',
    }),
};
