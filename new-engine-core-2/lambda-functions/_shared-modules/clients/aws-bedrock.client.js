// Native and 3rd party Node modules
import {
    BedrockAgentClient,
    CreateAgentCommand,
    CreateAgentAliasCommand,
    CreateKnowledgeBaseCommand,
    CreateDataSourceCommand,
    DeleteKnowledgeBaseCommand,
    PrepareAgentCommand,
    UpdateAgentCommand,
    UpdateAgentAliasCommand,
    GetKnowledgeBaseCommand,
    ListDataSourcesCommand,
    GetDataSourceCommand,
    GetAgentAliasCommand,
    GetAgentCommand,
} from '@aws-sdk/client-bedrock-agent';

// System env vars
const REGION = process.env.AWS_REGION;

export default class AwsBedrockClient {
    #client;

    constructor() {
        this.#client = new BedrockAgentClient({
            region: REGION,
        });
    }

    async createAgent(options) {
        const { agentName, foundationModel, agentResourceRoleArn, instruction, agentCollaboration } = options;
        const input = {
            agentName,
            foundationModel,
            agentResourceRoleArn,
            instruction,
            agentCollaboration,
        };
        console.log('AwsBedrockClient -> createAgent -> input:', JSON.stringify(input));
        const response = await this.#client.send(new CreateAgentCommand(input));
        return {
            agentId: response.agent.agentId,
        };
    }

    async prepareAgent(options) {
        const { agentId } = options;
        const input = {
            agentId,
        };
        console.log('AwsBedrockClient -> prepareAgent -> input:', JSON.stringify(input));
        await this.#client.send(new PrepareAgentCommand(input));
    }

    async createAgentAlias(options) {
        const { agentId, agentAliasName } = options;
        const input = {
            agentId,
            agentAliasName,
        };
        console.log('AwsBedrockClient -> createAgentAlias -> input:', JSON.stringify(input));
        const response = await this.#client.send(new CreateAgentAliasCommand(input));
        return {
            agentAliasId: response.agentAlias.agentAliasId,
        };
    }

    async updateAgent(options) {
        const { agentId, agentName, foundationModel, instruction, agentCollaboration, agentResourceRoleArn } = options;
        const input = {
            agentId,
            agentName,
            foundationModel,
            instruction,
            agentCollaboration,
            agentResourceRoleArn,
        };
        console.log('AwsBedrockClient -> updateAgent -> input:', JSON.stringify(input));
        await this.#client.send(new UpdateAgentCommand(input));
    }

    async updateAgentAlias(options) {
        const { agentId, agentAliasId, agentAliasName } = options;
        const input = {
            agentId,
            agentAliasId,
            agentAliasName,
        };
        console.log('AwsBedrockClient -> updateAgentAlias -> input:', JSON.stringify(input));
        await this.#client.send(new UpdateAgentAliasCommand(input));
    }

    async getAgent({ agentId }) {
        console.log('AwsBedrockClient -> getAgent -> agentId:', agentId);
        try {
            const response = await this.#client.send(
                new GetAgentCommand({
                    agentId,
                })
            );

            const agent = response.agent;

            return {
                agentId: agent.agentId,
                agentName: agent.agentName,
                // foundationModel can be returned by AWS in 2 formats: Model ID or Model ARN
                // split and pop help to return Model ID only
                foundationModel: agent.foundationModel?.split('/')?.pop(),
                instruction: agent.instruction,
                agentResourceRoleArn: agent.agentResourceRoleArn,
                agentCollaboration: agent.agentCollaboration,
                idleSessionTTLInSeconds: agent.idleSessionTTLInSeconds,
                agentStatus: agent.agentStatus,
                description: agent.description,
                orchestrationType: agent.orchestrationType,
                preparedAt: agent.preparedAt,
                createdAt: agent.createdAt,
                updatedAt: agent.updatedAt,
            };
        } catch (err) {
            if (err.name === 'ResourceNotFoundException') {
                return null;
            }
            throw new Error(err);
        }
    }

    async getAgentAlias({ agentId, agentAliasId }) {
        console.log('AwsBedrockClient -> getAgentAlias -> agentId:', agentId);
        console.log('AwsBedrockClient -> getAgentAlias -> agentAliasId:', agentAliasId);
        try {
            const response = await this.#client.send(
                new GetAgentAliasCommand({
                    agentId,
                    agentAliasId,
                })
            );
            return response.agentAlias;
        } catch (err) {
            if (err.name === 'ResourceNotFoundException') {
                return null;
            }
            throw new Error(err);
        }
    }

    async createKnowledgeBase(options) {
        const { name, description, roleArn, embeddingsModel, collectionArn, vectorBucketArn, indexArn, indexName } = options;
        const storageConfiguration = {
            type: collectionArn ? 'OPENSEARCH_SERVERLESS' : 'S3_VECTORS',
        };
        if (collectionArn) {
            storageConfiguration.opensearchServerlessConfiguration = {
                collectionArn,
                vectorIndexName: indexName,
                fieldMapping: {
                    vectorField: 'vector',
                    textField: 'text',
                    metadataField: 'metadata',
                },
            };
        } else if (vectorBucketArn) {
            storageConfiguration.s3VectorsConfiguration = {
                vectorBucketArn,
                indexArn,
            };
        }
        const input = {
            name,
            description,
            roleArn,
            knowledgeBaseConfiguration: {
                type: 'VECTOR',
                vectorKnowledgeBaseConfiguration: {
                    embeddingModelArn: `arn:aws:bedrock:${REGION}::foundation-model/${embeddingsModel}`,
                },
            },
            storageConfiguration,
        };
        console.log('AwsBedrockClient -> createKnowledgeBase -> input:', JSON.stringify(input));
        const response = await this.#client.send(new CreateKnowledgeBaseCommand(input));
        return {
            id: response.knowledgeBase.knowledgeBaseId,
        };
    }

    async addDataSourceToKnowledgeBase(options) {
        const { name, knowledgeBaseId, dataSourceType, s3Bucket, s3Prefix, webUrl, chunkingStrategy, chunkSize } = options;
        const dataSourceConfig = {};
        if (dataSourceType === 'S3') {
            dataSourceConfig.s3Configuration = {
                bucketArn: s3Bucket,
                inclusionPrefixes: [s3Prefix],
            };
        } else if (dataSourceType === 'WEB') {
            dataSourceConfig.webConfiguration = {
                sourceConfiguration: {
                    urlConfiguration: {
                        seedUrls: [
                            {
                                url: webUrl,
                            },
                        ],
                    },
                },
            };
        }
        const input = {
            knowledgeBaseId,
            name,
            dataDeletionPolicy: 'RETAIN',
            dataSourceConfiguration: {
                type: dataSourceType,
                ...dataSourceConfig,
            },
            vectorIngestionConfiguration: {
                chunkingConfiguration: {
                    chunkingStrategy,
                    fixedSizeChunkingConfiguration: {
                        maxTokens: chunkSize,
                        overlapPercentage: 20,
                    },
                },
            },
        };
        console.log('AwsBedrockClient -> addDataSourceToKnowledgeBase -> input:', JSON.stringify(input));
        const response = await this.#client.send(new CreateDataSourceCommand(input));
        return {
            id: response.dataSource.dataSourceId,
        };
    }

    async getKnowledgeBase({ knowledgeBaseId }) {
        console.log('AwsBedrockClient -> getKnowledgeBase -> knowledgeBaseId:', knowledgeBaseId);

        // Get knowledge base details
        const kbResponse = await this.#client.send(
            new GetKnowledgeBaseCommand({
                knowledgeBaseId,
            })
        );
        console.log('kbResponse:', JSON.stringify(kbResponse));

        const knowledgeBase = kbResponse.knowledgeBase;

        // Extract embeddings model from the ARN
        const embeddingModelArn = knowledgeBase.knowledgeBaseConfiguration?.vectorKnowledgeBaseConfiguration?.embeddingModelArn;
        const embeddingsModel = embeddingModelArn?.split('/').pop();

        // Extract OpenSearch collection ID from the collection ARN
        // ARN format: arn:aws:aoss:region:account-id:collection/collection-id
        const collectionArn = knowledgeBase.storageConfiguration?.opensearchServerlessConfiguration?.collectionArn;
        console.log('collectionArn:', collectionArn);
        const collectionId = collectionArn?.split('/').pop();
        console.log('collectionId:', collectionId);

        // Extract S3 vector bucket name from the vector bucket ARN
        // ARN format: arn:aws:s3vectors:region:account-id:bucket/bucket-name
        let vectorBucketArn = knowledgeBase.storageConfiguration?.s3VectorsConfiguration?.vectorBucketArn;
        if (!vectorBucketArn && knowledgeBase.storageConfiguration?.s3VectorsConfiguration?.indexArn) {
            vectorBucketArn = knowledgeBase.storageConfiguration.s3VectorsConfiguration.indexArn.split('/index/')[0];
        }
        console.log('vectorBucketArn:', vectorBucketArn);
        const vectorBucketName = vectorBucketArn?.split('/').pop();
        console.log('vectorBucketName:', vectorBucketName);

        // Get data sources for this knowledge base
        const dataSourcesResponse = await this.#client.send(
            new ListDataSourcesCommand({
                knowledgeBaseId,
            })
        );
        console.log('dataSourcesResponse:', dataSourcesResponse);

        // Get detailed information for the first data source (assuming one data source per KB)
        let dataSourceDetails = null;
        if (dataSourcesResponse.dataSourceSummaries?.length > 0) {
            const dataSourceId = dataSourcesResponse.dataSourceSummaries[0].dataSourceId;
            const dsResponse = await this.#client.send(
                new GetDataSourceCommand({
                    knowledgeBaseId,
                    dataSourceId,
                })
            );
            dataSourceDetails = dsResponse.dataSource;
        }
        console.log('dataSourceDetails:', dataSourceDetails);

        // Parse data source configuration
        let dataSourceId = null;
        let sourceType = null;
        let s3Folder = null;
        let url = null;
        let chunkingStrategy = null;
        let chunkSize = null;

        if (dataSourceDetails) {
            // Get data source ID
            dataSourceId = dataSourceDetails.dataSourceId;

            // Get type (S3 or WEB)
            sourceType = dataSourceDetails.dataSourceConfiguration?.type;

            // Get S3 folder if type is S3
            if (sourceType === 'S3') {
                const inclusionPrefixes = dataSourceDetails.dataSourceConfiguration?.s3Configuration?.inclusionPrefixes;
                s3Folder = inclusionPrefixes?.[0];
            }

            // Get URL if type is WEB
            if (sourceType === 'WEB') {
                const seedUrls =
                    dataSourceDetails.dataSourceConfiguration?.webConfiguration?.sourceConfiguration?.urlConfiguration?.seedUrls;
                url = seedUrls?.[0]?.url;
            }

            // Get chunking strategy and size
            chunkingStrategy = dataSourceDetails.vectorIngestionConfiguration?.chunkingConfiguration?.chunkingStrategy;
            chunkSize =
                dataSourceDetails.vectorIngestionConfiguration?.chunkingConfiguration?.fixedSizeChunkingConfiguration?.maxTokens;
        }

        return {
            knowledgeBaseId,
            collectionId,
            vectorBucketName,

            // 1st data source details
            dataSourceId,
            embeddingsModel,
            chunkingStrategy,
            chunkSize,
            sourceType,
            s3Folder, // 1st s3 folder (if source type is S3)
            url, // 1st url (if source type is WEB)
            destinationType: collectionId ? 'OpenSearch' : 'S3',
        };
    }

    async deleteKnowledgeBase({ knowledgeBaseId }) {
        console.log('AwsBedrockClient -> deleteKnowledgeBase -> knowledgeBaseId:', knowledgeBaseId);
        await this.#client
            .send(
                new DeleteKnowledgeBaseCommand({
                    knowledgeBaseId,
                })
            )
            .catch((err) => {
                console.log(err);
                if (err.name !== 'ResourceNotFoundException') {
                    throw new Error(err);
                }
            });
    }
}
