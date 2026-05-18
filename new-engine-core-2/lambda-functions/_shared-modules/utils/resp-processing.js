// TODO [IM] Does it make sense to move this file into separate f2-response-processing module?
import { randomUUID } from 'crypto';

import axios from 'axios';

import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { SQSClient, SendMessageCommand, GetQueueUrlCommand, CreateQueueCommand } from '@aws-sdk/client-sqs';

const ENV = process.env.ENV;
const AWS_REGION = process.env.AWS_REGION;
const ACCOUNT_ID = process.env.ACCOUNT_ID;

const sqsClient = new SQSClient({ region: AWS_REGION });
const secretsManagerClient = new SecretsManagerClient({ region: AWS_REGION });

export const publishReadTo360Dialog = async (messageId, channelId, sendTyping = false) => {
    try {
        const params = {
            SecretId: `f2-${ENV}/cx/channel-vendor-secret/${channelId}`,
        };

        const { SecretString } = await secretsManagerClient.send(new GetSecretValueCommand(params));
        const vendorSecret = JSON.parse(SecretString);

        const wa_payload = {
            messaging_product: 'whatsapp',
            status: 'read',
            message_id: messageId,
        };

        if (sendTyping) {
            wa_payload.typing_indicator = { type: 'text' };
        }

        console.log('>>>>> Read Payload');
        console.log(wa_payload);

        const { data } = await axios.post('https://waba-v2.360dialog.io/messages', wa_payload, {
            headers: {
                'Content-Type': 'application/json',
                'D360-API-KEY': vendorSecret.apiKey,
            },
        });

        console.log('>>>>> 360Dialog Read Response');
        console.log(data);
    } catch (e) {
        console.error('Error sending read to 360dialog:', e);
        throw e;
    }
};

export const publishTo360Dialog = async (
    messageText,
    channelId,
    clientId,
    accountId,
    chatMessageId,
    chatMessageDb,
    cx360DialogStatusDb
) => {
    try {
        const params = {
            SecretId: `f2-${ENV}/cx/channel-vendor-secret/${channelId}`,
        };

        const { SecretString } = await secretsManagerClient.send(new GetSecretValueCommand(params));
        const vendorSecret = JSON.parse(SecretString);

        const wa_payload = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            type: 'text',
            to: clientId,
            text: {
                body: messageText,
            },
        };

        console.log('>>>>> Payload');
        console.log(wa_payload);

        try {
            const { data } = await axios.post('https://waba-v2.360dialog.io/messages', wa_payload, {
                headers: {
                    'Content-Type': 'application/json',
                    'D360-API-KEY': vendorSecret.apiKey,
                },
            });

            console.log('>>>>> 360Dialog Response');
            console.log(data);

            await saveSentStatus({ channelId, accountId }, wa_payload, { ...data, status: 'accepted' }, cx360DialogStatusDb);
            await chatMessageDb.setVendorMessageId(data.messages?.[0]?.id, chatMessageId); // TODO [IM] should we go through array?
        } catch ({ response }) {
            console.log('>>>>> 360Dialog Sending Rejected');
            console.log(response);

            await saveSentStatus({ channelId, accountId }, wa_payload, { ...response, status: 'rejected' }, cx360DialogStatusDb);
        }
    } catch (e) {
        console.error('Error sending message to 360dialog:', e);
        throw e;
    }
};

const saveSentStatus = async (config, payload, response, cx360DialogStatusDb) => {
    const _payload = {
        channelId: config.channelId,
        accountId: config.accountId,
        messageId: response.messages?.[0]?.id || randomUUID(), // TODO [IM] should we go through array?
        status: response.status,
        // no timestamp
        type: payload.type,
        recipientId: payload.to, // TODO [IM] in May store as recipientUserId?
    };

    if (_payload.status === 'rejected') {
        _payload.details = response.data;
    }

    await cx360DialogStatusDb.addStatus(_payload);
};

export const publishToQueueForPolling = async (messageText, sessionId, from, files = [], sources = [], messageId, createdAt) => {
    try {
        const queueExists = await checkQueueExists(sessionId);

        const queueMessage = { from, files, sources, sessionId, messageText, messageId, createdAt };

        if (queueExists) {
            await sendMessageToQueue(queueMessage);
        } else {
            await createQueue(sessionId);
            await sendMessageToQueue(queueMessage);
        }
    } catch (e) {
        console.error('Error sending message to SQS queue:', e);
        throw e;
    }
};

export const createQueueForPolling = async (sessionId) => {
    try {
        const queueExists = await checkQueueExists(sessionId);

        if (!queueExists) {
            await createQueue(sessionId);
        }
    } catch (e) {
        console.error('Error creating SQS queue:', e);
        throw e;
    }
};

const checkQueueExists = async (sessionId) => {
    const queueName = `${sessionId}.fifo`;
    const params = { QueueName: queueName };

    try {
        await sqsClient.send(new GetQueueUrlCommand(params));
        console.log(`>>>>> The polling queue exists.`);
        return true;
    } catch (e) {
        if (e.name === 'QueueDoesNotExist') {
            console.log('>>>>> The polling queue does not exist.');
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
            createdAt: message.createdAt,
        }),
        MessageDeduplicationId: `${Date.now()}-${Math.random()}`,
        MessageGroupId: message.sessionId,
    };

    await sqsClient.send(new SendMessageCommand(params));
    console.log('>>>>> The message is sent to polling queue.');
};

const createQueue = async (sessionId) => {
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
    console.log('>>>>> The polling queue is created.');
};
