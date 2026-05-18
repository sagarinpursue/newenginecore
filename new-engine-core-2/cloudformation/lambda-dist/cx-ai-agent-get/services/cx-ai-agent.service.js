// Native and 3rd party Node modules

// Custom Node modules
import { AwsBedrockClient } from '@shared-modules/f2-clients';
import { CxAiAgentDbApi } from '@shared-modules/f2-db-api';

// Custom env vars
const DB_API_URL = process.env.DB_API_URL;

const awsBedrockClient = new AwsBedrockClient();

export const get = async ({ dbApiKey, token, data }) => {
    const { aiAgentId } = data;

    const cxAiAgentDbApi = new CxAiAgentDbApi(DB_API_URL, dbApiKey, token);
    const aiAgent = await cxAiAgentDbApi.get(aiAgentId);

    const agent = await awsBedrockClient.getAgent({ agentId: aiAgent.agentId });
    const agentAlias = await awsBedrockClient.getAgentAlias({ agentId: aiAgent.agentId, agentAliasId: aiAgent.agentAliasId });

    return {
        // From DB
        id: aiAgentId,
        agentId: aiAgent.agentId,
        agentAliasId: aiAgent.agentAliasId,
        agentName: aiAgent.name,

        // From AWS Bedrock
        agentVersion: 'DRAFT', // agentAlias.routingConfiguration[0].agentVersion,
        agentCollaboration: agent.agentCollaboration,
        foundationModel: agent.foundationModel,
        idleSessionTTLInSeconds: agent.idleSessionTTLInSeconds,
        agentStatus: agent.agentStatus,
        description: agent.description,
        instruction: agent.instruction,
        orchestrationType: agent.orchestrationType,
        preparedAt: agent.preparedAt,
        createdAt: agent.createdAt,
        updatedAt: agent.updatedAt,
        deployedAt: agentAlias.updatedAt,
    };
};
