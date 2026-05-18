// import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';

import middy from '@middy/core';
import secretsManager from '@middy/secrets-manager';

import { ChatbotSessionDbApi, ChatMessageDbApi, Cx360DialogStatusDbApi, LiveChatSessionDbApi } from '@shared-modules/f2-db-api';
import { publishTo360Dialog, publishToQueueForPolling, Responses } from '@shared-modules/f2-utils';

// const ENV = process.env.ENV;
// const APP_NAME = process.env.APP_NAME;
// const AWS_REGION = process.env.AWS_REGION;
const DB_API_URL = process.env.DB_API_URL;
const JWT_AUTHORIZER_SECRET = process.env.JWT_AUTHORIZER_SECRET;
const LC_SECRET_KEY = process.env.LC_SECRET_KEY;

// const lambdaClient = new LambdaClient({ region: AWS_REGION });

const SUPPORTED_ACTIONS = ['incoming_event', 'chat_deactivated'];

export const handler = middy(async (event, context) => {
    console.log('event', JSON.stringify(event));

    const chatbotSessionDb = new ChatbotSessionDbApi(
        DB_API_URL,
        context.jwtAuth.serviceRoleKey,
        `Bearer ${context.jwtAuth.serviceRoleKey}`
    );
    const chatMessageDb = new ChatMessageDbApi(
        DB_API_URL,
        context.jwtAuth.serviceRoleKey,
        `Bearer ${context.jwtAuth.serviceRoleKey}`
    );
    const cx360DialogStatusDb = new Cx360DialogStatusDbApi(
        DB_API_URL,
        context.jwtAuth.serviceRoleKey,
        `Bearer ${context.jwtAuth.serviceRoleKey}`
    );
    const liveChatSessionDb = new LiveChatSessionDbApi(DB_API_URL, context.jwtAuth.anonKey);

    try {
        const body = event.body;
        if (body.secret_key !== LC_SECRET_KEY) {
            console.error('Error: Incorrect Secret Key');
            return Responses.emptySuccess;
        }

        if (!SUPPORTED_ACTIONS.includes(body.action)) {
            console.error('Error: Unsupported Action');
            return Responses.emptySuccess;
        }

        if (!body.payload?.chat_id) {
            console.error('Error: Incorrect Data Structure');
            return Responses.emptySuccess;
        }

        if (body.action === 'incoming_event' && (body.payload?.event?.type !== 'message' || !body.payload?.event?.text)) {
            console.error('Error: Unsupported Event Type');
            return Responses.emptySuccess;
        }

        let from;
        let messageText;
        switch (body.action) {
            case 'incoming_event':
                from = 'live-agent';
                messageText = body.payload.event.text;
                break;
            case 'chat_deactivated':
                from = 'system';
                messageText = 'Chat with Live Agent closed.';
                break;
            default:
                from = 'live-agent';
                messageText = '';
                break;
        }

        const lcSession = await liveChatSessionDb.getSessionByChatId(body.payload.chat_id);

        console.log('LiveChat Session:', lcSession);

        if (body.action === 'chat_deactivated') {
            await liveChatSessionDb.updateActivityFlag(body.payload.chat_id, false);
            await chatbotSessionDb.updateConnectionFlag(lcSession.session_id, false);
        }

        // const payload = {
        //     from,
        //     files: [],
        //     messageText,
        //     sessionId: lcSession.session_id,
        // };

        // TODO: [IM] calling cx-response-processing must be replaced with f2-utils/resp-processing
        // await invokeLambda('cx-response-processing', 'Event', payload);

        const chatAgentMessage = {
            content: messageText,
            source: from,
            messageType: 'text',
            sessionId: lcSession.session_id,
            sources: [],
        };
        const { chat_message_id, created_at } = await chatMessageDb.saveMessage(chatAgentMessage);

        const session = await chatbotSessionDb.getSessionById(lcSession.session_id);

        // TODO [IM] Move whole if-else to f2-utils? Stopping factor: Too many parameters need to be passed.
        if (session.vendor_type === '360dialog') {
            console.log('>>>>> Sending to 360dialog');

            try {
                await publishTo360Dialog(
                    messageText,
                    session.channel_id,
                    session.vendor_client_id,
                    session.account_id,
                    chat_message_id,
                    chatMessageDb,
                    cx360DialogStatusDb
                );
            } catch (err) {
                console.error('Error while sending message to 360dialog', err);
            }
        } else {
            console.log('>>>>> Sending to Polling Queue');

            try {
                await publishToQueueForPolling(messageText, lcSession.session_id, from, [], [], chat_message_id, created_at);
            } catch (err) {
                console.error('Error while sending message to polling queue', err);
            }
        }

        return Responses.emptySuccess;
    } catch (e) {
        console.error(e);
        return Responses.emptySuccess;
    }
}).use([
    secretsManager({
        fetchData: {
            jwtAuth: JWT_AUTHORIZER_SECRET,
        },
        disablePrefetch: true,
        setToContext: true,
    }),
]);

// const invokeLambda = async (lambdaName, invocationType, payload) => {
//     const params = {
//         FunctionName: `${APP_NAME}-${lambdaName}-${ENV}`,
//         InvocationType: invocationType,
//         Payload: JSON.stringify(payload),
//     };
//
//     return lambdaClient.send(new InvokeCommand(params));
// };
