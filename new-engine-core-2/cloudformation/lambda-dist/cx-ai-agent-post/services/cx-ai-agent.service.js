// Native and 3rd party Node modules
import { randomUUID } from 'crypto';

// Custom Node modules
import { AwsBedrockClient } from '@shared-modules/f2-clients';
import { CxAiAgentDbApi } from '@shared-modules/f2-db-api';

// Custom env vars
const DB_API_URL = process.env.DB_API_URL;
const BEDROCK_AGENT_ROLE_ARN = process.env.BEDROCK_AGENT_ROLE_ARN;

const awsBedrockClient = new AwsBedrockClient();

export const createNew = async ({ dbApiKey, token, data }) => {
    const agent = await awsBedrockClient.createAgent({
        agentName: data.name,
        foundationModel: data.model,
        instruction: data.instruction,
        agentCollaboration: data.agentCollaboration,
        agentResourceRoleArn: BEDROCK_AGENT_ROLE_ARN,
    });

    // Wait until agent created
    await new Promise((resolve) => setTimeout(resolve, 5000));

    await awsBedrockClient.prepareAgent({
        agentId: agent.agentId,
    });

    // Wait until agent prepared
    await new Promise((resolve) => setTimeout(resolve, 5000));

    const agentAlias = await awsBedrockClient.createAgentAlias({
        agentId: agent.agentId,
        agentAliasName: 'default',
    });

    const cxAiAgentDbApi = new CxAiAgentDbApi(DB_API_URL, dbApiKey, token);
    const aiAgentId = randomUUID();
    await cxAiAgentDbApi.create({
        aiAgentId,
        agentId: agent.agentId,
        agentAliasId: agentAlias.agentAliasId,
        name: data.name,

        userId: data.userId,
        accountId: data.accountId,
    });

    return {
        id: aiAgentId,
    };
};

export const importExisting = async ({ dbApiKey, token, data }) => {
    const { agentId, agentAliasId, name, userId, accountId } = data;

    const [agent, agentAlias] = await Promise.all([
        awsBedrockClient.getAgent({ agentId }),
        awsBedrockClient.getAgentAlias({ agentId, agentAliasId }),
    ]);

    if (!agent || !agentAlias) {
        // TODO: need improve error and update http-error-formatter to support this error
        // Today, it is returned as 500 Internal Server Error
        throw new Error('Not found');
    }

    const cxAiAgentDbApi = new CxAiAgentDbApi(DB_API_URL, dbApiKey, token);
    const aiAgentId = randomUUID();
    await cxAiAgentDbApi.create({
        aiAgentId,
        agentId: agentId,
        agentAliasId: agentAliasId,
        name: name,

        isImported: true,

        userId: userId,
        accountId: accountId,
    });

    return {
        id: aiAgentId,
    };
};
