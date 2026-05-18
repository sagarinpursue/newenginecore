export default {
    headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4YmJmYWNlNS1hYTI5LTQzOTgtYTI0Ny0zNGI0MjhjMzVmOWYiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzYzMTA2OTY3LCJpYXQiOjE3NjMxMDMzNjcsImVtYWlsIjoidmFkaW1AMmxlbWV0cnkuaW8iLCJwaG9uZSI6IiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImVtYWlsIiwicHJvdmlkZXJzIjpbImVtYWlsIl19LCJ1c2VyX21ldGFkYXRhIjp7fSwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJwYXNzd29yZCIsInRpbWVzdGFtcCI6MTc2MTgwMTUxNn1dLCJzZXNzaW9uX2lkIjoiYWJjZWVhN2YtNDk1Yi00YzQzLTlhMzAtMDAzNGU3NzIxZWI4IiwiaXNfYW5vbnltb3VzIjpmYWxzZX0.lqGRu-eTfDDo1E8de8fQ15LybOOCiwks5H0KQa3h-G4`,
    },
    body: JSON.stringify({
        name: 'test-ve-222',
        model: 'anthropic.claude-3-5-sonnet-20240620-v1:0',
        instruction: 'You are a helpful assistant. Be smart and helpful',
    }),
};
