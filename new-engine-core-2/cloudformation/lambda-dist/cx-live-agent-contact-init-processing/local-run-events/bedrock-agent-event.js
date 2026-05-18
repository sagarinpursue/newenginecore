export default {
    messageVersion: '1.0',
    function: 'call_live_agent',
    parameters: [
        { name: 'phoneNumber', type: 'string', value: '967-877-4013' },
        { name: 'fullName', type: 'string', value: 'Maksim Kropanov' },
        {
            name: 'email',
            type: 'string',
            value: 'mkropanov@confidenceway.com',
        },
    ],
    sessionId: 'd7869db0-a269-dbb2-e49c-e78d3b41abd9',
    agent: {
        name: 'f2-iga-cb-agent',
        version: 'DRAFT',
        id: '',
        alias: '',
    },
    actionGroup: 'action_group_call_live_agent',
    sessionAttributes: {},
    promptSessionAttributes: {
        localeId: 'en_US',
        sessionId: 'd7869db0-a269-dbb2-e49c-e78d3b41abd9',
        connectInstanceId: 'cabecd5b-96b5-4b4d-83c3-021cb2e4717e',
        connectFlowId: '29cd0f52-8d84-47a4-b291-31b6105a680f',
        connectStreamingEndpointTopic: 'f2ce-live-agent-messages',
    },
    inputText: 'Maksim Kropanov, 967-877-4013, mkropanov@confidenceway.com',
};
