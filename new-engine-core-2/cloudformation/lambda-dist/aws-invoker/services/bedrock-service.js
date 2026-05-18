import { ListFoundationModelsCommand } from '@aws-sdk/client-bedrock';

export default class BedrockService {
    #client;

    constructor(client) {
        this.#client = client;
    }

    async getModels(query) {
        return this.#client.send(new ListFoundationModelsCommand(query));
    }
}
