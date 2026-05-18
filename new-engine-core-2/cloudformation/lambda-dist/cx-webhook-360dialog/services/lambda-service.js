import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

const client = new LambdaClient({
    region: process.env.AWS_REGION,
});

/**
 * Invokes an AWS Lambda function.
 *
 * @param {string} functionName - The name of the Lambda function.
 * @param {"RequestResponse" | "Event"} invocationType - Invocation type.
 * @param {object} payload - The payload to send.
 * @returns {Promise<{ body: string, status: string, statusCode: number } | any>}
 */
export const invokeLambda = async (functionName, invocationType, payload) => {
    const invokeParams = {
        FunctionName: functionName,
        InvocationType: invocationType, // 'RequestResponse' waits for a response, 'Event' is async
        Payload: JSON.stringify(payload),
    };

    try {
        const command = new InvokeCommand(invokeParams);
        const response = await client.send(command);

        const statusCode = response.StatusCode || 500;

        if (invocationType === 'RequestResponse') {
            if (!response.Payload) {
                return {
                    status: 'error',
                    statusCode,
                    body: JSON.stringify('Empty response payload'),
                };
            }

            const result = Buffer.from(response.Payload).toString();

            try {
                return JSON.parse(result);
                // eslint-disable-next-line no-unused-vars
            } catch (parseError) {
                return {
                    status: 'error',
                    statusCode,
                    body: JSON.stringify({ message: 'Failed to parse response', raw: result }),
                };
            }
        }

        // Handling asynchronous invocation ('Event')
        if (statusCode >= 400) {
            return {
                status: 'error',
                statusCode,
                body: JSON.stringify({ message: 'Lambda invocation failed' }),
            };
        }

        return {
            status: 'success',
            statusCode,
            body: JSON.stringify('Request processed successfully'),
        };
    } catch (error) {
        console.error('Invocation error:', error);
        return {
            status: 'error',
            statusCode: error.$metadata?.httpStatusCode || 500,
            body: JSON.stringify({ message: error.message }),
        };
    }
};
