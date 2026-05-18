// Native and 3rd party Node modules

// Custom Node modules
import { AwsBedrockClient } from '@shared-modules/f2-clients';
import { CxAiAgentDbApi } from '@shared-modules/f2-db-api';

// Custom env vars
const DB_API_URL = process.env.DB_API_URL;
const BEDROCK_AGENT_ROLE_ARN = process.env.BEDROCK_AGENT_ROLE_ARN;

const awsBedrockClient = new AwsBedrockClient();

export const update = async ({ dbApiKey, token, data }) => {
    if (data.update) {
        await awsBedrockClient.updateAgent({
            agentId: data.agentId,

            agentName: data.name,
            foundationModel: data.model,
            instruction: data.instruction,
            agentCollaboration: data.agentCollaboration,

            agentResourceRoleArn: BEDROCK_AGENT_ROLE_ARN,
        });
        const cxAiAgentDbApi = new CxAiAgentDbApi(DB_API_URL, dbApiKey, token);
        await cxAiAgentDbApi.update({
            aiAgentId: data.aiAgentId,
            name: data.name,
        });
    }

    if (data.prepare) {
        // Wait until agent updated
        await new Promise((resolve) => setTimeout(resolve, 5000));
        await awsBedrockClient.prepareAgent({
            agentId: data.agentId,
        });
    }

    if (data.deploy) {
        // Wait until agent updated/prepared
        await new Promise((resolve) => setTimeout(resolve, 5000));
        await awsBedrockClient.updateAgentAlias({
            agentId: data.agentId,
            agentAliasId: data.agentAliasId,
            agentAliasName: 'default',
        });
    }
};
