export default {
    headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4YmJmYWNlNS1hYTI5LTQzOTgtYTI0Ny0zNGI0MjhjMzVmOWYiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzYxNjUzNTg0LCJpYXQiOjE3NjE2NDk5ODQsImVtYWlsIjoidmFkaW1AMmxlbWV0cnkuaW8iLCJwaG9uZSI6IiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImVtYWlsIiwicHJvdmlkZXJzIjpbImVtYWlsIl19LCJ1c2VyX21ldGFkYXRhIjp7fSwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJwYXNzd29yZCIsInRpbWVzdGFtcCI6MTc2MDk1NTQ4Nn1dLCJzZXNzaW9uX2lkIjoiYTViNWQ0MWMtMTVjZi00M2UyLWI4MWUtNDk0YjU3ZDQ0MzJmIiwiaXNfYW5vbnltb3VzIjpmYWxzZX0.TulUDnKC_NzjGYYPRhAcp-NldZauoEU7h0kb46abxuE`,
    },
    body: JSON.stringify({
        name: 'test-ve-002',
        sourceType: 'S3',
        destinationType: 'OpenSearch',
        s3Folder: 'test-ve-002',
        embeddingModels: 'amazon.titan-embed-text-v1',
        chunkingStrategy: 'FIXED_SIZE',
        chunkSize: 300,
    }),
};
