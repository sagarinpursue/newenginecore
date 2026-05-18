export default {
    $metadata: {
        httpStatusCode: 200,
        requestId: 'a91d6cf0-5a42-4ed6-b2fe-fe17e67d7e9f',
        attempts: 1,
        totalRetryDelay: 0,
    },
    interpretations: [
        { intent: [Object], interpretationSource: 'Lex' },
        {
            intent: [Object],
            interpretationSource: 'Lex',
            nluConfidence: [Object],
        },
    ],
    messages: [
        {
            content: 'Hello! How can I assist you today?',
            contentType: 'PlainText',
        },
    ],
    requestAttributes: {
        'x-amz-lex:qnA-search-response': 'Hello! How can I assist you today?',
    },
    sessionId: '3f2a1b7c-8d9f-4b02-b6e4-72f92a6c9c31',
    sessionState: {
        dialogAction: { type: 'ElicitIntent' },
        originatingRequestId: 'a91d6cf0-5a42-4ed6-b2fe-fe17e67d7e9f',
        sessionAttributes: {
            'x-amz-lex:qnA-search-response': 'Hello! How can I assist you today?',
        },
    },
    input: 'Hello',
    localeId: 'en_US',
    config: {
        instanceId: 'cabecd5b-96b5-4b4d-83c3-021cb2e4717e',
        agentId: null,
        agentAliasId: null,
        agentLlmStructureId: null,
        agentKnowledgeBaseId: null,
        botId: 'RFFQIN6TX1',
        botAliasId: 'TSTALIASID',
        botLlmStructureId: '7c348aec-3a86-4648-98eb-04377ede952d',
        botKnowledgeBaseId: 'none',
    },
};
