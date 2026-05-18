export default {
    headers: {
        Authorization:
            'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1MDJlMTIzMC04MmIwLTQ4ZjYtYTRkZS1lYmE2YTRlZTQxODYiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzY0NTk2MDc3LCJpYXQiOjE3NjQ1OTI0NzcsImVtYWlsIjoidmFkaW0rbGxtQDJsZW1ldHJ5LmlvIiwicGhvbmUiOiIyMzQxMjQxMjQxMjMyMyIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImVtYWlsIiwicHJvdmlkZXJzIjpbImVtYWlsIiwicGhvbmUiXX0sInVzZXJfbWV0YWRhdGEiOnsiZGlzcGxheV9uYW1lIjoiVmFkaW0gTExNIn0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3NjQ1OTI0Nzd9XSwic2Vzc2lvbl9pZCI6IjYxZWJiM2IwLTRmYTUtNGM1OS05MjQ3LTU3YjhhODE2Mjg1YiIsImlzX2Fub255bW91cyI6ZmFsc2V9.Ow1kydqyMd8dk_L9iQHbCfedgjdhfC6ais2Sg307EC0',
    },
    body: {
        page: 1,
        pageSize: 5,
        resourceType: 'cx_chat_session_feedbacks',
        sortBy: 'feedback_text',
        sortOrder: 'asc',
        searchBy: ['feedback_text'],
        searchString: '',
        createdFrom: '2025-02-01',
        createdTo: '2025-11-28',
    },
};
