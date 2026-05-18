// Native and 3rd party Node modules
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

// System env vars
const REGION = process.env.AWS_REGION;

export default class AwsLambdaClient {
    #client;

    constructor() {
        this.#client = new LambdaClient({
            region: REGION,
        });
    }

    async invokeEvent({ name, payload }) {
        await this.#client.send(
            new InvokeCommand({
                FunctionName: name,
                Payload: JSON.stringify(payload),
                InvocationType: 'Event',
            })
        );
    }
}
