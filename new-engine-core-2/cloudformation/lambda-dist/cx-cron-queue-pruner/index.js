import { validate as uuidValidate } from 'uuid';

import { CloudWatchClient, GetMetricStatisticsCommand } from '@aws-sdk/client-cloudwatch';
import { SQSClient, ListQueuesCommand, DeleteQueueCommand } from '@aws-sdk/client-sqs';

import middy from '@middy/core';
import inputOutputLogger from '@middy/input-output-logger';

import { httpResponseFormatter, httpErrorFormatter } from '@shared-modules/f2-middlewares';

const AWS_REGION = process.env.AWS_REGION;
const ACCOUNT_ID = process.env.ACCOUNT_ID;

const MAX_RESULTS = '1000';
const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;
const ONE_DAY_IN_SECONDS = 86400;

const sqsClient = new SQSClient({ region: AWS_REGION });
const cloudWatchClient = new CloudWatchClient({ region: AWS_REGION });

export const handler = middy(async () => {
    try {
        const queueUrls = await listQueues();
        if (!queueUrls.length) {
            console.log('No queues found.');
            return;
        }

        const queueNames = extractQueueNames(queueUrls);
        const startTime = new Date(Date.now() - ONE_DAY_IN_MS);

        for (const queueName of queueNames) {
            const sessionId = queueName.split('.')[0];
            if (!uuidValidate(sessionId)) {
                console.log('Skipping queue as it is not a f2 session queue:', queueName);
                continue;
            }

            const count = await getQueueSentMessageCount(queueName, startTime);
            console.log(`${queueName} -> ${count}`);

            if (count === 0) {
                console.log(`Queue ${queueName} will be deleted as it has no sent messages.`);
                await deleteQueue(queueName);
            }
        }
    } catch (error) {
        console.error('Error in handler:', error);
    }
}).use([inputOutputLogger(), httpResponseFormatter(), httpErrorFormatter()]);

const listQueues = async () => {
    const params = { MaxResults: Number(MAX_RESULTS) };
    const { QueueUrls } = await sqsClient.send(new ListQueuesCommand(params));
    return QueueUrls || [];
};

const extractQueueNames = (queueUrls) => queueUrls.map((url) => url.split('/').pop());

const getQueueSentMessageCount = async (queueName, startTime) => {
    const endTime = new Date();
    const params = {
        Namespace: 'AWS/SQS',
        MetricName: 'NumberOfMessagesSent',
        Dimensions: [{ Name: 'QueueName', Value: queueName }],
        StartTime: startTime,
        EndTime: endTime,
        Period: ONE_DAY_IN_SECONDS,
        Statistics: ['Sum'],
    };

    const command = new GetMetricStatisticsCommand(params);
    const data = await cloudWatchClient.send(command);
    const datapoints = data.Datapoints;
    return datapoints && datapoints.length > 0 ? datapoints[0].Sum : 0;
};

const deleteQueue = async (queueName) => {
    const queueUrl = `https://sqs.${AWS_REGION}.amazonaws.com/${ACCOUNT_ID}/${queueName}`;
    const command = new DeleteQueueCommand({ QueueUrl: queueUrl });
    await sqsClient.send(command);
};
