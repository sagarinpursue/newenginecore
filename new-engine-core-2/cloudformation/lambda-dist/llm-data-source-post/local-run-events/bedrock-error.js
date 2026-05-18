export default {
    headers: {
        Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1MDJlMTIzMC04MmIwLTQ4ZjYtYTRkZS1lYmE2YTRlZTQxODYiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzM5OTQ4NzY4LCJpYXQiOjE3Mzk5NDUxNjgsImVtYWlsIjoidmFkaW0rbGxtQDJsZW1ldHJ5LmlvIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdfSwidXNlcl9tZXRhZGF0YSI6e30sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3Mzk0NDU5MTh9XSwic2Vzc2lvbl9pZCI6IjhmNDA0ZDUyLTUxM2EtNDUwYy1iZTdhLWI2MmMyNDA3ZWMzMyIsImlzX2Fub255bW91cyI6ZmFsc2V9.8A3wPppnVR0rI_Bm7pKdXUAT7JY-ba7lrvpLl3zRaKw`,
    },
    body: JSON.stringify({
        name: 'test-001',
        s3Folder: 'test-001',
        embeddingModels: 'unknown',
        chunkingStrategy: 'FIXED_SIZE',
        chunkSize: 300,
    }),
};
