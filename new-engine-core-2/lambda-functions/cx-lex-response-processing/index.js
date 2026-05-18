import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';

import middy from '@middy/core';
import inputOutputLogger from '@middy/input-output-logger';

import { httpResponseFormatter, httpErrorFormatter } from '@shared-modules/f2-middlewares';

import validateRequestEvent from './utils/validation.js';

const ENV = process.env.ENV;
const APP_NAME = process.env.APP_NAME;
const AWS_REGION = process.env.AWS_REGION;

const lambdaClient = new LambdaClient({ region: AWS_REGION });

export const handler = middy(async (event) => {
    await validateRequestEvent(event);
    const { sessionId, input, localeId, config } = event;

    const response = {
        messageText: '',
    };

    if (event.interpretations[0].intent.name === 'FallbackIntent') {
        response.messageText = event.requestAttributes['x-amz-lex:qnA-search-response'];
    } else if (event.interpretations[0].intent.name === 'LiveAgentIntent') {
        await invokeLambda('initiate-live-agent-session', 'Event', { sessionId, input, localeId, config });
        response.messageText = event.messages[0].content;
    }

    if (!response.messageText || response.messageText === 'CANNOTANSWER' || response.messageText === '') {
        response.messageText = 'I’m sorry, I don’t have enough information on that. Could you clarify?';
    }

    console.log('response:', response);
    return { data: response };
}).use([inputOutputLogger(), httpResponseFormatter(), httpErrorFormatter()]);

const invokeLambda = async (lambdaName, invocationType, payload) => {
    const params = {
        FunctionName: `${APP_NAME}-${lambdaName}-${ENV}`,
        InvocationType: invocationType,
        Payload: JSON.stringify(payload),
    };

    return await lambdaClient.send(new InvokeCommand(params));
};
