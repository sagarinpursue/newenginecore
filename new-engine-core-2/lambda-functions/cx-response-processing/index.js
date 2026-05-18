import { SQSClient, SendMessageCommand, GetQueueUrlCommand, CreateQueueCommand } from '@aws-sdk/client-sqs';

import middy from '@middy/core';
import secretsManager from '@middy/secrets-manager';

import { ChatMessageDbApi } from '@shared-modules/f2-db-api';

import { Responses } from './utils/responses.js';
import validateRequestEvent from './utils/validation.js';

const AWS_REGION = process.env.AWS_REGION;
const ACCOUNT_ID = process.env.ACCOUNT_ID;
const DB_API_URL = process.env.DB_API_URL;
const JWT_AUTHORIZER_SECRET = process.env.JWT_AUTHORIZER_SECRET;

const sqsClient = new SQSClient({ region: AWS_REGION });

// TODO [IM] IMPORTANT: This lambda should be completely replaced by f2-utils/resp-processing
export const handler = middy(async (event, context) => {
    console.log('event', event);

    const chatMessageDb = new ChatMessageDbApi(
        DB_API_URL,
        context.jwtAuth.serviceRoleKey,
        `Bearer ${context.jwtAuth.serviceRoleKey}`
    );

    await validateRequestEvent(event);
    const { messageText, sessionId, from, files = [], sources = [] } = event;

    // TODO: rename to responseChatMessage or chatResponseMessage
    const chatMessage = {
        content: messageText,
        source: from,
        messageType: 'text',
        sessionId: sessionId,
        sources,
    };
    const { chat_message_id } = await chatMessageDb.saveMessage(chatMessage);

    const queueExists = await checkQueueExists(sessionId);

    const queueMessage = {
        from,
        files,
        sources,
        sessionId,
        messageText,
        messageId: chat_message_id,
    };

    try {
        if (queueExists) {
            await sendMessageToQueue(queueMessage);
        } else {
            await createQueue(sessionId);
            await sendMessageToQueue(queueMessage);
        }
    } catch (e) {
        return Responses.serverError(e);
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

const checkQueueExists = async (sessionId) => {
    const queueName = `${sessionId}.fifo`;
    const params = { QueueName: queueName };

    try {
        await sqsClient.send(new GetQueueUrlCommand(params));
        console.log(`The queue exists.`);
        return true;
    } catch (e) {
        if (e.name === 'QueueDoesNotExist') {
            console.log('The queue does not exist.');
            return false;
        }
    }
};

const sendMessageToQueue = async (message) => {
    const params = {
        QueueUrl: `https://sqs.${AWS_REGION}.amazonaws.com/${ACCOUNT_ID}/${message.sessionId}.fifo`,
        MessageBody: JSON.stringify({
            files: message.files,
            sources: message.sources,
            messageId: message.messageId,
            messageText: message.messageText,
        }),
        MessageDeduplicationId: `${Date.now()}-${Math.random()}`,
        MessageGroupId: message.sessionId,
    };

    await sqsClient.send(new SendMessageCommand(params));
    console.log('The message is sent.');
};

const createQueue = async (sessionId) => {
    // NOTE: Generate queueName by using sessionId
    const queueName = `${sessionId}.fifo`;

    const params = {
        QueueName: queueName,
        Attributes: {
            FifoQueue: 'true',
            ContentBasedDeduplication: 'true',
            DeduplicationScope: 'messageGroup',
            FifoThroughputLimit: 'perMessageGroupId',
        },
    };

    await sqsClient.send(new CreateQueueCommand(params));
    console.log('The queue is created.');
};
