export default {
    headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1MDJlMTIzMC04MmIwLTQ4ZjYtYTRkZS1lYmE2YTRlZTQxODYiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzYwMDAyNzI4LCJpYXQiOjE3NTk5OTkxMjgsImVtYWlsIjoidmFkaW0rbGxtQDJsZW1ldHJ5LmlvIiwicGhvbmUiOiIyMzQxMjQxMjQxMjMyMyIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImVtYWlsIiwicHJvdmlkZXJzIjpbImVtYWlsIiwicGhvbmUiXX0sInVzZXJfbWV0YWRhdGEiOnsiZGlzcGxheV9uYW1lIjoiVmFkaW0gTExNIn0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3NTk5OTkxMjh9XSwic2Vzc2lvbl9pZCI6ImNhOGM3NWIzLWEzNjYtNDQwYy1hYThmLTNlYjYzYmNjNWQwOCIsImlzX2Fub255bW91cyI6ZmFsc2V9.UIJsIzBOU_UpT7VpNwe9m86hyef3tzgBCwZ5FRCLYXU`,
    },
    body: JSON.stringify({
        uploadDescription: 'test upload description',
        documentsMetadata: [
            {
                documentName: 'test.png',
                documentSize: 56300,
                documentType: 'image/png',
                documentId: '3423e503-7281-4d51-aa0e-7514063ee653',
            },
        ],
    }),
};
