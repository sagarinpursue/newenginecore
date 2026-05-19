export default {
    httpMethod: 'POST',
    path: '/search',
    headers: {
        Authorization: 'Bearer test',
    },
    body: {
        resourceType: 'cx_report_message_ratings',
        createdFrom: '2025-01-01T00:00:00.000Z',
        createdTo: '2026-12-31T23:59:59.999Z',
        pageSize: 10,
        page: 1,
        searchString: '',
        filter: {
            channelFilter: 'all',
            accountFilter: 'all',
        },
    },
};
