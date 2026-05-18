export default {
    httpMethod: 'POST',
    path: `/llm-rule`,
    headers: {
        'Content-Type': 'application/json',
        Authorization:
            'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1MDJlMTIzMC04MmIwLTQ4ZjYtYTRkZS1lYmE2YTRlZTQxODYiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzQzNzcxNTg0LCJpYXQiOjE3NDM3Njc5ODQsImVtYWlsIjoidmFkaW0rbGxtQDJsZW1ldHJ5LmlvIiwicGhvbmUiOiIyMzQxMjQxMjQxMjMyMyIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImVtYWlsIiwicHJvdmlkZXJzIjpbImVtYWlsIl19LCJ1c2VyX21ldGFkYXRhIjp7ImRpc3BsYXlfbmFtZSI6IlZhZGltIExMTSJ9LCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImFhbCI6ImFhbDEiLCJhbXIiOlt7Im1ldGhvZCI6InBhc3N3b3JkIiwidGltZXN0YW1wIjoxNzQzNzY3OTg0fV0sInNlc3Npb25faWQiOiI4NGFiOTBhMS05MDY1LTQxNTAtYTJlOS04ZDU0ZjViMzRjOTAiLCJpc19hbm9ueW1vdXMiOmZhbHNlfQ.H0ytvgn1grrUsCck8F4VoDIe5o61EaJ3Wl4vNoT-Hc0',
    },
    body: JSON.stringify({
        llm_rule_id: 'dc91fb06-16da-407f-8fb6-37cc29d5c594',
        llm_ruleset_id: '3c8dc3e5-ee20-40b1-84d9-c7226cb80a5b',
        name: 'test',
        value: 'test',
        user_id: '502e1230-82b0-48f6-a4de-eba6a4ee4186',
        account_id: '00000000-0000-0000-0000-000000000000',
    }),
};
