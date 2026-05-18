export default {
    headers: {
        Authorization:
            'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1MDJlMTIzMC04MmIwLTQ4ZjYtYTRkZS1lYmE2YTRlZTQxODYiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzY1OTYzMjg3LCJpYXQiOjE3NjU5NTk2ODcsImVtYWlsIjoidmFkaW0rbGxtQDJsZW1ldHJ5LmlvIiwicGhvbmUiOiIyMzQxMjQxMjQxMjMyMyIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImVtYWlsIiwicHJvdmlkZXJzIjpbImVtYWlsIiwicGhvbmUiXX0sInVzZXJfbWV0YWRhdGEiOnsiZGlzcGxheV9uYW1lIjoiVmFkaW0gTExNIn0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3NjU5NTk2ODd9XSwic2Vzc2lvbl9pZCI6IjBiOWJjODE2LTdhOWQtNGE3NS1iMDNmLWMxNTNjZDUyM2YzNyIsImlzX2Fub255bW91cyI6ZmFsc2V9.QCweV0NwHtNUSOYMakbwWVeksJtuGKYPz7jlcdnnc_8',
    },
    body: {
        resourceType: 'cx_report_messages_with_issues_get',
        createdFrom: '2025-12-09T00:00:00.000+03:00',
        createdTo: '2025-12-15T23:59:59.999+03:00',
        pageSize: 2,
        page: 1,
        filter: {
            channelFilter: 'all',
            accountFilter: 'all',
        },
    },
};
