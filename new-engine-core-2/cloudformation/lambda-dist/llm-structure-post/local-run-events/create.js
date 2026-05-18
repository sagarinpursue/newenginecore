const token =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1MDJlMTIzMC04MmIwLTQ4ZjYtYTRkZS1lYmE2YTRlZTQxODYiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzM5OTUzMjQ4LCJpYXQiOjE3Mzk5NDk2NDgsImVtYWlsIjoidmFkaW0rbGxtQDJsZW1ldHJ5LmlvIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdfSwidXNlcl9tZXRhZGF0YSI6e30sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3Mzk0NDU5MTh9XSwic2Vzc2lvbl9pZCI6IjhmNDA0ZDUyLTUxM2EtNDUwYy1iZTdhLWI2MmMyNDA3ZWMzMyIsImlzX2Fub255bW91cyI6ZmFsc2V9.FAMn5zIF_KBOU9g-kwi5SnS9VfB3HsBrwhnmeVf9QZ8';

export default {
    headers: {
        Authorization: `Bearer ${token}`,
        apikey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE',
    },
    body: {
        name: 'test-001',
        type: 'type',
        model: 'model',
        sourceId: 'sourceId',
        sourceType: 'sourceType',
        framework: 'framework',
    },
};
