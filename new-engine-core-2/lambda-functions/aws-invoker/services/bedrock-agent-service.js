// Native and 3rd party Node modules
import {
    GetAgentCommand,
    StartIngestionJobCommand,
    GetIngestionJobCommand,
    ListAgentActionGroupsCommand,
    GetAgentActionGroupCommand,
    ListAgentCollaboratorsCommand,
    ListAgentKnowledgeBasesCommand,
    AssociateAgentKnowledgeBaseCommand,
    UpdateAgentKnowledgeBaseCommand,
    DisassociateAgentKnowledgeBaseCommand,
    CreateAgentActionGroupCommand,
    UpdateAgentActionGroupCommand,
    DeleteAgentActionGroupCommand,
    AssociateAgentCollaboratorCommand,
    UpdateAgentCollaboratorCommand,
    DisassociateAgentCollaboratorCommand,
} from '@aws-sdk/client-bedrock-agent';
import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts';

// System env vars
const REGION = process.env.AWS_REGION;

export default class BedrockService {
    #client;
    #stsClient;
    #accountId;

    constructor(client) {
        this.#client = client;
        this.#stsClient = new STSClient({ region: REGION });
    }

    async #getAccountId() {
        if (!this.#accountId) {
            const { Account } = await this.#stsClient.send(new GetCallerIdentityCommand({}));
            this.#accountId = Account;
        }
        return this.#accountId;
    }

    async sync(payload) {
        return this.#client.send(
            new StartIngestionJobCommand({
                knowledgeBaseId: payload.knowledgeBaseId,
                dataSourceId: payload.dataSourceId,
            })
        );
    }

    async getSyncStatus(payload) {
        return this.#client.send(
            new GetIngestionJobCommand({
                knowledgeBaseId: payload.knowledgeBaseId,
                dataSourceId: payload.dataSourceId,
                ingestionJobId: payload.ingestionJobId,
            })
        );
    }

    async getListAgentActionGroups(payload) {
        const response = await this.#client.send(
            new ListAgentActionGroupsCommand({
                agentId: payload.agentId,
                agentVersion: 'DRAFT',
            })
        );

        console.log(response);

        // Exclude built-in actions groups, like UserInput and CodeInterpreter
        if (response.actionGroupSummaries) {
            const detailedActionGroups = await Promise.all(
                response.actionGroupSummaries.map((summary) =>
                    this.getAgentActionGroup({
                        agentId: payload.agentId,
                        agentVersion: 'DRAFT',
                        actionGroupId: summary.actionGroupId,
                    })
                )
            );

            console.log(detailedActionGroups);

            const customActionGroupIds = new Set(
                detailedActionGroups
                    .filter((detail) => !detail.agentActionGroup.parentActionSignature)
                    .map((detail) => detail.agentActionGroup.actionGroupId)
            );

            console.log(customActionGroupIds);

            response.actionGroupSummaries = response.actionGroupSummaries.filter((summary) =>
                customActionGroupIds.has(summary.actionGroupId)
            );
        }

        return response.actionGroupSummaries || [];
    }

    async getAgentActionGroup(payload) {
        return this.#client.send(
            new GetAgentActionGroupCommand({
                agentId: payload.agentId,
                agentVersion: 'DRAFT',
                actionGroupId: payload.actionGroupId,
            })
        );
    }

    async addActionGroupToAgent(payload) {
        const accountId = await this.#getAccountId();
        return this.#client.send(
            new CreateAgentActionGroupCommand({
                agentId: payload.agentId,
                agentVersion: 'DRAFT', // Only DRAFT version supported by AWS
                actionGroupName: payload.actionGroupName,
                description: payload.description,
                actionGroupExecutor: {
                    lambda: `arn:aws:lambda:${REGION}:${accountId}:function:${payload.lambdaName}`,
                },
                functionSchema: {
                    functions: payload.functions.map((func) => ({
                        name: func.name,
                        description: func.description,
                        parameters:
                            func.parameters?.reduce((parametersObj, parameter) => {
                                parametersObj[parameter.name] = {
                                    description: parameter.description,
                                    type: parameter.type.toLowerCase(),
                                    required: true,
                                };
                                return parametersObj;
                            }, {}) || {},
                    })),
                },
            })
        );
    }

    async updateActionGroupForAgent(payload) {
        const accountId = await this.#getAccountId();
        return this.#client.send(
            new UpdateAgentActionGroupCommand({
                agentId: payload.agentId,
                agentVersion: 'DRAFT', // Only DRAFT version supported by AWS
                actionGroupId: payload.actionGroupId,
                actionGroupName: payload.actionGroupName,
                description: payload.description,
                actionGroupState: payload.actionGroupState || 'ENABLED',
                actionGroupExecutor: {
                    lambda: `arn:aws:lambda:${REGION}:${accountId}:function:${payload.lambdaName}`,
                },
                functionSchema: {
                    functions: payload.functions?.map((func) => ({
                        name: func.name,
                        description: func.description,
                        parameters:
                            func.parameters?.reduce((parametersObj, parameter) => {
                                parametersObj[parameter.name] = {
                                    description: parameter.description,
                                    type: parameter.type.toLowerCase(),
                                    required: true,
                                };
                                return parametersObj;
                            }, {}) || {},
                    })) || [
                        {
                            name: payload.actionGroupName,
                        },
                    ],
                },
            })
        );
    }

    async deleteActionGroupFromAgent(payload) {
        return this.#client.send(
            new DeleteAgentActionGroupCommand({
                agentId: payload.agentId,
                agentVersion: 'DRAFT', // Only DRAFT version supported by AWS
                actionGroupId: payload.actionGroupId,
            })
        );
    }

    async getListAgentCollaborators(payload) {
        const response = await this.#client.send(
            new ListAgentCollaboratorsCommand({
                agentId: payload.agentId,
                agentVersion: 'DRAFT', // Only DRAFT version supported by AWS
            })
        );

        return response.agentCollaboratorSummaries || [];
    }

    async addCollaboratorToAgent(payload) {
        const accountId = await this.#getAccountId();
        return this.#client.send(
            new AssociateAgentCollaboratorCommand({
                agentId: payload.agentId,
                agentVersion: 'DRAFT', // Only DRAFT version supported by AWS
                agentDescriptor: {
                    aliasArn: `arn:aws:bedrock:${REGION}:${accountId}:agent-alias/${payload.collaboratorAgentId}/${payload.collaboratorAgentAliasId}`,
                },
                collaboratorName: payload.collaboratorName,
                collaborationInstruction: payload.collaborationInstruction,
            })
        );
    }

    async updateCollaboratorForAgent(payload) {
        const accountId = await this.#getAccountId();
        return this.#client.send(
            new UpdateAgentCollaboratorCommand({
                agentId: payload.agentId,
                agentVersion: 'DRAFT', // Only DRAFT version supported by AWS
                collaboratorId: payload.collaboratorId,
                agentDescriptor: {
                    aliasArn: `arn:aws:bedrock:${REGION}:${accountId}:agent-alias/${payload.collaboratorAgentId}/${payload.collaboratorAgentAliasId}`,
                },
                collaboratorName: payload.collaboratorName,
                collaborationInstruction: payload.collaborationInstruction,
            })
        );
    }

    async deleteCollaboratorFromAgent(payload) {
        return this.#client.send(
            new DisassociateAgentCollaboratorCommand({
                agentId: payload.agentId,
                agentVersion: 'DRAFT', // Only DRAFT version supported by AWS
                collaboratorId: payload.collaboratorId,
            })
        );
    }

    async addKnowledgeBaseToAgent(payload) {
        return this.#client.send(
            new AssociateAgentKnowledgeBaseCommand({
                agentId: payload.agentId,
                agentVersion: 'DRAFT', // Only DRAFT version supported by AWS
                knowledgeBaseId: payload.knowledgeBaseId,
                description: payload.description,
            })
        );
    }

    async updateKnowledgeBaseForAgent(payload) {
        return this.#client.send(
            new UpdateAgentKnowledgeBaseCommand({
                agentId: payload.agentId,
                agentVersion: 'DRAFT', // Only DRAFT version supported by AWS
                knowledgeBaseId: payload.knowledgeBaseId,
                description: payload.description,
            })
        );
    }

    async deleteKnowledgeBaseFromAgent(payload) {
        return this.#client.send(
            new DisassociateAgentKnowledgeBaseCommand({
                agentId: payload.agentId,
                agentVersion: 'DRAFT', // Only DRAFT version supported by AWS
                knowledgeBaseId: payload.knowledgeBaseId,
            })
        );
    }

    async getListAgentKnowledgeBases(payload) {
        const response = await this.#client.send(
            new ListAgentKnowledgeBasesCommand({
                agentId: payload.agentId,
                agentVersion: 'DRAFT',
            })
        );

        return response.agentKnowledgeBaseSummaries || [];
    }

    async getAgent(payload) {
        return this.#client.send(
            new GetAgentCommand({
                agentId: payload.agentId,
            })
        );
    }
}
