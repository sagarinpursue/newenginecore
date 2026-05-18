export const Responses = {
    invalidRequestParams: {
        messageVersion: '1.0',
        response: {
            actionGroup: 'action_group_call_live_agent',
            function: 'call_live_agent',
            functionResponse: {
                responseState: 'REPROMPT',
                responseBody: {
                    TEXT: {
                        body: JSON.stringify('Something went wrong. Please try again after a while.'),
                    },
                },
            },
        },
    },
    success: {
        messageVersion: '1.0',
        response: {
            actionGroup: 'action_group_call_live_agent',
            function: 'call_live_agent',
            functionResponse: {
                responseBody: {
                    TEXT: {
                        body: JSON.stringify("Agent connected. Please don't close the chat window."),
                    },
                },
            },
        },
    },
    serverError: () => ({
        messageVersion: '1.0',
        response: {
            actionGroup: 'action_group_call_live_agent',
            function: 'call_live_agent',
            functionResponse: {
                responseBody: {
                    TEXT: {
                        body: JSON.stringify('No agent available. Please try again after a while.'),
                    },
                },
            },
        },
    }),
};
