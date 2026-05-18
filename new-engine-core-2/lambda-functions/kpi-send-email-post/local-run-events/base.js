export default {
    headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5MzgzZjU5Yy1hNDhjLTRlYmUtYTlkMi0yMGU4Yzg3ZTkyN2QiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzQ3MjE2MjY1LCJpYXQiOjE3NDcyMTI2NjUsImVtYWlsIjoiYWFsaGlkZGlAbW9mYS5nb3YuYmgiLCJwaG9uZSI6IiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImVtYWlsIiwicHJvdmlkZXJzIjpbImVtYWlsIl19LCJ1c2VyX21ldGFkYXRhIjp7fSwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJwYXNzd29yZCIsInRpbWVzdGFtcCI6MTc0NjYyMjQ0M31dLCJzZXNzaW9uX2lkIjoiMDU3YmRkMDAtYmFkZC00YTQ1LTljYzQtNzc3YzE0Y2EyNGEwIiwiaXNfYW5vbnltb3VzIjpmYWxzZX0.c5DBrrCdrOe63-Hzeu5Y2QPKN6aiR64l3dRVTVZ3wlc`,
    },
    body: JSON.stringify({
        notificationType: 'reminderMissedServices',
        reportId: 'c932851a-499f-4fc4-8b58-29c13dc36287',
    }),
};
