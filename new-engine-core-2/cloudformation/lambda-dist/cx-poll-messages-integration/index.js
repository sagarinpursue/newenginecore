// Native and 3rd party Node modules
import { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } from '@aws-sdk/client-sqs';

import middy from '@middy/core';
import httpJsonBodyParser from '@middy/http-json-body-parser';
import inputOutputLogger from '@middy/input-output-logger';
import validator from '@middy/validator';

import Ajv from 'ajv';
import ajvErrors from 'ajv-errors';
import ajvFormats from 'ajv-formats';

import { httpErrorFormatter, httpResponseFormatter } from '@shared-modules/f2-middlewares';

// Custom Node modules
import { eventSchema } from './schemas/event.js';

// System env vars
const AWS_REGION = process.env.AWS_REGION;

// Custom env vars
const ACCOUNT_ID = process.env.ACCOUNT_ID;

// Create AJV instance and configure it with ajv-errors and ajv-formats
const ajv = new Ajv({ coerceTypes: 'number', strictTypes: false, allowUnionTypes: true, allErrors: true });
ajvFormats(ajv);
ajvErrors(ajv);

// Create AWS clients
const sqsClient = new SQSClient({ region: AWS_REGION });

export const handler = middy(async (event) => {
    const { sessionId } = event.queryStringParameters;

    const response = {
        messages: [],
    };

    const queueUrl = `https://sqs.${AWS_REGION}.amazonaws.com/${ACCOUNT_ID}/${sessionId}.fifo`;

    const params = {
        QueueUrl: queueUrl,
        MaxNumberOfMessages: 10,
        WaitTimeSeconds: 3,
        AttributeNames: ['MessageGroupId'],
    };

    let data;
    try {
        data = await sqsClient.send(new ReceiveMessageCommand(params));
    } catch (error) {
        if (error.name === 'QueueDoesNotExist' || error.Code === 'AWS.SimpleQueueService.NonExistentQueue') {
            return {
                data: {
                    message: 'No new messages available.',
                    messages: [],
                },
            };
        }
    }

    if (!data.Messages) {
        return {
            data: {
                message: 'No new messages available.',
                messages: [],
            },
        };
    }

    for (let message of data.Messages) {
        addMessageToResponse(message, response);
        await removeMessageFromQueue(message, queueUrl);
    }

    return { data: response };
}).use([
    inputOutputLogger(),
    httpJsonBodyParser({
        disableContentTypeError: true,
    }),
    validator({ eventSchema: ajv.compile(eventSchema) }),
    httpResponseFormatter(),
    httpErrorFormatter(),
]);

const addMessageToResponse = (message, response) => {
    const body = JSON.parse(message.Body);
    response.messages.push({
        text: body.messageText,
        files: body.files,
        sources: body.sources,
        messageId: body.messageId,
        createdAt: body.createdAt,
        // from: '',
    });
};

const removeMessageFromQueue = async (message, queueUrl) => {
    const deleteParams = {
        QueueUrl: queueUrl,
        ReceiptHandle: message.ReceiptHandle,
    };

    await sqsClient.send(new DeleteMessageCommand(deleteParams));
};
