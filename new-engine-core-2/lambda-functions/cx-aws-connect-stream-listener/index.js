// import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';

import middy from '@middy/core';
import inputOutputLogger from '@middy/input-output-logger';
import secretsManager from '@middy/secrets-manager';

import { ChatMessageDbApi, Cx360DialogStatusDbApi } from '@shared-modules/f2-db-api';
import { httpResponseFormatter, httpErrorFormatter } from '@shared-modules/f2-middlewares';
import { publishTo360Dialog, publishToQueueForPolling } from '@shared-modules/f2-utils';

import ChatbotSessionDb from './db/chatbot-session-db.js';
import ConnectContactDb from './db/connect-contact-db.js';
import { t } from './i18n/index.js';
import { validateRequestEvent } from './utils/validation.js';

// const ENV = process.env.ENV;
const DB_API_URL = process.env.DB_API_URL;
const JWT_AUTHORIZER_SECRET = process.env.JWT_AUTHORIZER_SECRET;
// const APP_NAME = process.env.APP_NAME;
// const AWS_REGION = process.env.AWS_REGION;

// const lambdaClient = new LambdaClient({ region: AWS_REGION });

export const handler = middy(async (event, context) => {
    const chatbotSessionDb = new ChatbotSessionDb(DB_API_URL, context.jwtAuth.anonKey);
    const contactSessionDb = new ConnectContactDb(DB_API_URL, context.jwtAuth.anonKey); // FIXME: rename prototype

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

    const validationFailed = validateRequestEvent(event);

    if (validationFailed) {
        return validationFailed;
    }

    const { Records } = event;

    for (let record of Records) {
        const processedPayload = processSns(record.Sns);

        if (!processedPayload) {
            continue; // skip metadata messages
        }

        const { Message, InitialContactId } = processedPayload;
        const { session_id, locale_id } = await contactSessionDb.getContactSessionDetails(InitialContactId);
        const message = await generateChatMessage(chatbotSessionDb, Message, session_id, locale_id);

        // TODO: [IM] calling cx-response-processing must be replaced with f2-utils/resp-processing
        // await invokeLambda('cx-response-processing', 'Event', { ...message });

        const chatAgentMessage = {
            content: message.messageText,
            source: message.from,
            messageType: 'text',
            sessionId: message.sessionId,
            sources: [],
        };
        const { chat_message_id, created_at } = await chatMessageDb.saveMessage(chatAgentMessage);

        const session = await chatbotSessionDb.getSessionById(message.sessionId);

        // TODO [IM] Move whole if-else to f2-utils? Stopping factor: Too many parameters need to be passed.
        if (session.vendor_type === '360dialog') {
            console.log('>>>>> Sending to 360dialog');

            try {
                await publishTo360Dialog(
                    message.messageText,
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
                await publishToQueueForPolling(
                    message.messageText,
                    message.sessionId,
                    message.from,
                    [],
                    [],
                    chat_message_id,
                    created_at
                );
            } catch (err) {
                console.error('Error while sending message to polling queue', err);
            }
        }
    }
    return { data: {} };
}).use([
    inputOutputLogger(),
    secretsManager({
        fetchData: {
            jwtAuth: JWT_AUTHORIZER_SECRET,
        },
        disablePrefetch: true,
        setToContext: true,
    }),
    httpResponseFormatter(),
    httpErrorFormatter(),
]);

const processSns = (sns) => {
    const parsedMessage = JSON.parse(sns.Message);

    if (shouldSkipMessage(sns, parsedMessage)) {
        return null;
    }

    return { ...sns, Message: parsedMessage, InitialContactId: sns.MessageAttributes?.InitialContactId?.Value };
};

const shouldSkipMessage = (sns, parsedMessage) => {
    console.log('sns:', sns);
    if (sns.MessageAttributes?.Type?.Value === 'MESSAGEMETADATA') {
        return true;
    }
    if (parsedMessage.ContentType === 'application/vnd.amazonaws.connect.event.typing') {
        return true;
    }
    if (parsedMessage.Type === 'MESSAGE' && !parsedMessage.Content?.trim()) {
        return true;
    }
    // NOTE: skip customer messages (maybe filter these type of messages on subscription filtering)
    if (parsedMessage.ParticipantRole === 'CUSTOMER' && parsedMessage.Content) {
        return true;
    }

    return false;
};

const generateChatMessage = async (chatbotSessionDb, payload, sessionId, localeId) => {
    const msg = {
        messageText: '',
        sessionId: sessionId,
        from: 'live-agent', // TODO: add live-agent or system by the logic below, added live-agent by default so far
    };

    if (
        payload.Content === 'Something went wrong. Goodbye.' ||
        payload.Content === 'We are not able to take your call right now. Goodbye.'
    ) {
        // Some error or no agents available right now.
        msg.from = 'system';
        msg.messageText = t(localeId, 'no_agents_available');
        await chatbotSessionDb.updateConnectionToken(sessionId, null);
    }

    if (
        payload.ContentType === 'application/vnd.amazonaws.connect.event.participant.left' &&
        payload.ParticipantRole === 'AGENT'
    ) {
        // The agent has been disconnected.
        msg.from = 'system';
        msg.messageText = t(localeId, 'agent_is_disconnected');
        await chatbotSessionDb.updateConnectionToken(sessionId, null);
    }

    if (
        payload.ContentType === 'application/vnd.amazonaws.connect.event.participant.joined' &&
        payload.ParticipantRole === 'AGENT'
    ) {
        // The agent is connected.
        msg.from = 'system';
        msg.messageText = t(localeId, 'agent_is_connected', { name: payload.DisplayName });
    }

    if (payload.ParticipantRole === 'AGENT' && payload.Content) {
        // The agent is sent a message
        msg.from = 'live-agent';
        msg.messageText = payload.Content;
    }

    if (
        payload.ContentType === 'application/vnd.amazonaws.connect.event.participant.left' &&
        payload.ParticipantRole === 'CUSTOMER'
    ) {
        // The customer has been disconnected.
        msg.from = 'system';
        msg.messageText = t(localeId, 'customer_is_disconnected');
    }

    // FIXME: it's not the case in the queue
    if (payload.ParticipantRole === 'SYSTEM' && payload.Content?.includes('You are in the queue.')) {
        // Put in queue
        msg.from = 'system';
        msg.messageText = t(localeId, 'customer_is_in_queue');
    }

    if (payload.Content === 'All agents busy') {
        // All agents busy
        msg.from = 'system';
        msg.messageText = t(localeId, 'all_agents_busy');
    }

    if (msg.messageText === '') {
        throw new Error('Message processing failed: messageText is empty, no cases handled.');
    }

    // TODO: handle this case - application/vnd.amazonaws.connect.event.chat.ended

    console.debug('The message is:', msg);

    return msg;
};

// const invokeLambda = async (lambdaName, invocationType, payload) => {
//     const params = {
//         FunctionName: `${APP_NAME}-${lambdaName}-${ENV}`,
//         InvocationType: invocationType,
//         Payload: JSON.stringify(payload),
//     };
//
//     return await lambdaClient.send(new InvokeCommand(params));
// };
