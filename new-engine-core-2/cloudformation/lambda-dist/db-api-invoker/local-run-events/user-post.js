export default {
    httpMethod: 'POST',
    path: `/user`,
    headers: {
        Authorization:
            'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1MDJlMTIzMC04MmIwLTQ4ZjYtYTRkZS1lYmE2YTRlZTQxODYiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzYxMTQzODU4LCJpYXQiOjE3NjExNDAyNTgsImVtYWlsIjoidmFkaW0rbGxtQDJsZW1ldHJ5LmlvIiwicGhvbmUiOiIyMzQxMjQxMjQxMjMyMyIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImVtYWlsIiwicHJvdmlkZXJzIjpbImVtYWlsIiwicGhvbmUiXX0sInVzZXJfbWV0YWRhdGEiOnsiZGlzcGxheV9uYW1lIjoiVmFkaW0gTExNIn0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3NjExNDAyNTh9XSwic2Vzc2lvbl9pZCI6IjU3ODFkMmRhLTFiN2EtNGNhZi05MzM2LWU3YjYxYmE2MjFmMSIsImlzX2Fub255bW91cyI6ZmFsc2V9.yKD38tNPLF6WNILEYKPzIYMiEuuR9R6DHtyvbDsWWyk',
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        email: 'test2@2lemetry.io',
        password: '3dk#ifko',
        email_confirm: true,
    }),
};
