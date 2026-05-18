export default {
    headers: {
        Authorization:
            'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4YmJmYWNlNS1hYTI5LTQzOTgtYTI0Ny0zNGI0MjhjMzVmOWYiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzYwOTY3MDk5LCJpYXQiOjE3NjA5NjM0OTksImVtYWlsIjoidmFkaW1AMmxlbWV0cnkuaW8iLCJwaG9uZSI6IiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImVtYWlsIiwicHJvdmlkZXJzIjpbImVtYWlsIl19LCJ1c2VyX21ldGFkYXRhIjp7fSwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJwYXNzd29yZCIsInRpbWVzdGFtcCI6MTc2MDk1NTQ4Nn1dLCJzZXNzaW9uX2lkIjoiYTViNWQ0MWMtMTVjZi00M2UyLWI4MWUtNDk0YjU3ZDQ0MzJmIiwiaXNfYW5vbnltb3VzIjpmYWxzZX0.ihbEUAXktN8dCw9QCOtzXp3hitYaeOedY8cMMKYSGQo',
    },
    body: {
        page: 3,
        pageSize: 2,
        resourceType: 'llm_structure',
        sortBy: 'name',
        sortOrder: 'asc',
        searchBy: ['name'],
        searchString: 'test',
        createdFrom: '2025-10-01',
        createdTo: '2025-10-31',
    },
};
