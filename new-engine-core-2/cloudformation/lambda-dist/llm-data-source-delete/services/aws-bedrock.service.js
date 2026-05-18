import { AwsBedrockClient } from '@shared-modules/f2-clients';

export default class AwsBedrockService {
    #client;

    constructor() {
        this.#client = new AwsBedrockClient();
    }

    async deleteKnowledgeBase(options) {
        const { knowledgeBaseId } = options;
        await this.#client.deleteKnowledgeBase({
            knowledgeBaseId,
        });
    }
}
