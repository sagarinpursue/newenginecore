export default {
    httpMethod: 'GET',
    path: `/cx/dashboard/metrics`,
    queryStringParameters: {
        channel_filter: 'all',
        account_filter: 'all',
        start_date: '2025-10-01T00:00:00.000Z',
        end_date: '2025-10-10T00:00:00.000Z',
    },
    headers: {
        Authorization:
            'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1MDJlMTIzMC04MmIwLTQ4ZjYtYTRkZS1lYmE2YTRlZTQxODYiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzYyMzUwNDEwLCJpYXQiOjE3NjIzNDY4MTAsImVtYWlsIjoidmFkaW0rbGxtQDJsZW1ldHJ5LmlvIiwicGhvbmUiOiIyMzQxMjQxMjQxMjMyMyIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImVtYWlsIiwicHJvdmlkZXJzIjpbImVtYWlsIiwicGhvbmUiXX0sInVzZXJfbWV0YWRhdGEiOnsiZGlzcGxheV9uYW1lIjoiVmFkaW0gTExNIn0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3NjIzNDY4MTB9XSwic2Vzc2lvbl9pZCI6Ijk0ZjhiZDQwLTBiMTEtNGM0Mi1iYTAwLWM1YzZlNmVhNDE0YyIsImlzX2Fub255bW91cyI6ZmFsc2V9.yTctiLAy7BxQpWDi8O45oxuaJv3hHIIYGKcEJGiBbZs',
        Prefer: 'count=exact',
    },
};
