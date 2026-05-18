export default {
    headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4YmJmYWNlNS1hYTI5LTQzOTgtYTI0Ny0zNGI0MjhjMzVmOWYiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzYzMTIwNzk5LCJpYXQiOjE3NjMxMTcxOTksImVtYWlsIjoidmFkaW1AMmxlbWV0cnkuaW8iLCJwaG9uZSI6IiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImVtYWlsIiwicHJvdmlkZXJzIjpbImVtYWlsIl19LCJ1c2VyX21ldGFkYXRhIjp7fSwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJwYXNzd29yZCIsInRpbWVzdGFtcCI6MTc2MTgwMTUxNn1dLCJzZXNzaW9uX2lkIjoiYWJjZWVhN2YtNDk1Yi00YzQzLTlhMzAtMDAzNGU3NzIxZWI4IiwiaXNfYW5vbnltb3VzIjpmYWxzZX0.6vupI6tj9q1crWvCbzK4-Od-iTjqQKwU1cuw3gPwQcs`,
    },
    body: JSON.stringify({
        aiAgentId: 'd47b9da1-044f-4831-960b-72710bd14990',
        agentId: '83WBYYRTDN',
        agentAliasId: 'SKVR1HSUBG',
        name: 'test-ve-010',
        model: 'anthropic.claude-3-5-sonnet-20240620-v1:0',
        instruction: 'You are a helpful assistant. Be smart and helpful',
        update: true,
    }),
};
