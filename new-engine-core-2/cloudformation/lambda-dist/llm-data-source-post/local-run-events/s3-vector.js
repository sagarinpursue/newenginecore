export default {
    headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4YmJmYWNlNS1hYTI5LTQzOTgtYTI0Ny0zNGI0MjhjMzVmOWYiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzY0ODUxNjY1LCJpYXQiOjE3NjQ4NDgwNjUsImVtYWlsIjoidmFkaW1AMmxlbWV0cnkuaW8iLCJwaG9uZSI6IiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImVtYWlsIiwicHJvdmlkZXJzIjpbImVtYWlsIl19LCJ1c2VyX21ldGFkYXRhIjp7fSwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJwYXNzd29yZCIsInRpbWVzdGFtcCI6MTc2NDMwNzY5Mn1dLCJzZXNzaW9uX2lkIjoiMDQ1ZGZkNmYtM2VjZS00OGU2LThiNTQtMjIzYjMyNjZmMThjIiwiaXNfYW5vbnltb3VzIjpmYWxzZX0.2nC2gkp7RN2TBAfIjWOH0p-WsnjqgGZA0WnQp97vIHM`,
    },
    body: JSON.stringify({
        name: 'test-ve-001',
        sourceType: 'S3',
        destinationType: 'S3',
        s3Folder: 'default',
        embeddingModels: 'amazon.titan-embed-text-v1',
        chunkingStrategy: 'FIXED_SIZE',
        chunkSize: 300,
    }),
};
