export default {
    httpMethod: 'GET',
    path: '/cx/dashboard/period-summary',
    headers: {
        Authorization: 'Bearer test',
    },
    queryStringParameters: {
        channel_filter: 'all',
        account_filter: 'all',
        p_start_date: '2025-01-01T00:00:00.000Z',
        p_end_date: '2026-12-31T23:59:59.999Z',
        p_timezone: 'Asia/Dubai',
    },
};
