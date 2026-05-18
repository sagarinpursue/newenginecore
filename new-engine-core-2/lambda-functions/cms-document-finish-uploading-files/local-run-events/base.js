export default {
    headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1MDJlMTIzMC04MmIwLTQ4ZjYtYTRkZS1lYmE2YTRlZTQxODYiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzYwNzExMTI2LCJpYXQiOjE3NjA3MDc1MjYsImVtYWlsIjoidmFkaW0rbGxtQDJsZW1ldHJ5LmlvIiwicGhvbmUiOiIyMzQxMjQxMjQxMjMyMyIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImVtYWlsIiwicHJvdmlkZXJzIjpbImVtYWlsIiwicGhvbmUiXX0sInVzZXJfbWV0YWRhdGEiOnsiZGlzcGxheV9uYW1lIjoiVmFkaW0gTExNIn0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3NjA3MDc1MjZ9XSwic2Vzc2lvbl9pZCI6ImE2ZTk5MDBhLTE2NjEtNDc2My04NmQ1LTEzNGU4YTc1NWEzYSIsImlzX2Fub255bW91cyI6ZmFsc2V9.ppY2EHUiTpoLzpJp24WkhnEqQ_GDvgIF7UDxlEuekm8`,
    },
    body: JSON.stringify({
        destinationFolder: '/',
        documents: [
            {
                documentId: '3e956aa5-647e-4377-be6f-f4c1a88301d8',
                documentName: 'test.txt',
            },
        ],
    }),
};
