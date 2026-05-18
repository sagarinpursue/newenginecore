import path from 'path';
import { fileURLToPath } from 'url';

import {
    APIGatewayClient,
    GetRestApisCommand,
    CreateRestApiCommand,
    PutRestApiCommand,
    CreateDeploymentCommand,
    CreateApiKeyCommand,
    CreateUsagePlanCommand,
    CreateUsagePlanKeyCommand,
    GetApiKeysCommand,
    UpdateApiKeyCommand,
    UpdateUsagePlanCommand,
    GetUsagePlansCommand,
} from '@aws-sdk/client-api-gateway';

import { getFiles } from '../utils.js';

import { buildEndpointConfig, buildOptionsConfig, buildProxyEndpointConfig } from './api-utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async (environment) => {
    console.log('ApiGateway -> started');

    const config = (await import(`../.environment/${environment}/config.js`)).default;
    const apiGatewayClient = new APIGatewayClient({
        profile: config.aws.profile,
        region: config.aws.region,
    });

    try {
        const folders = ['list'];

        for (const folder of folders) {
            console.log('ApiGateway -> folder:', folder);
            const files = await getFiles(path.join(__dirname, folder));
            console.log('ApiGateway -> files:', files);
            const apiList = (await Promise.all(files.map((file) => (async (file) => import(`./${folder}/${file}`))(file)))).map(
                (module) => module.default(config)
            );

            for (const api of apiList) {
                console.log('ApiGateway -> api.name:', api.name);
                if (!api.name) {
                    console.log('ApiGateway -> skipped');
                    continue;
                }

                let existingApi = await checkApiExists(apiGatewayClient, api.name);
                console.log('ApiGateway -> existingApi:', !!existingApi);
                if (!existingApi) {
                    console.log('ApiGateway -> create');
                    existingApi = await apiGatewayClient.send(
                        new CreateRestApiCommand({
                            name: api.name,
                            description: api.description,
                            endpointConfiguration: {
                                types: api.types,
                            },
                        })
                    );
                    console.log('ApiGateway -> created');
                }
                console.log('ApiGateway -> existingApi.id:', existingApi.id);
                await apiGatewayClient.send(
                    new PutRestApiCommand({
                        restApiId: existingApi.id,
                        mode: 'overwrite',
                        body: Buffer.from(JSON.stringify(buildSwagger(config, api))),
                        failOnWarnings: true,
                    })
                );
                console.log('ApiGateway -> swagger uploaded');

                await apiGatewayClient.send(
                    new CreateDeploymentCommand({
                        restApiId: existingApi.id,
                        stageName: api.stage,
                    })
                );
                console.log('ApiGateway -> deployed');

                const existingUsagePlans = await apiGatewayClient.send(new GetUsagePlansCommand({}));
                const usagePlansResponse = await Promise.all(
                    api.usagePlans.map((usagePlan) =>
                        (async (usagePlan) => {
                            let usagePlanResponse = existingUsagePlans.items?.find((item) => item.name === usagePlan.name);
                            if (usagePlanResponse) {
                                const patchOperations = [];

                                if (usagePlan.throttle?.rateLimit) {
                                    patchOperations.push({
                                        op: 'replace',
                                        path: '/throttle/rateLimit',
                                        value: `${usagePlan.throttle.rateLimit}`,
                                    });
                                }

                                if (usagePlan.throttle?.burstLimit) {
                                    patchOperations.push({
                                        op: 'replace',
                                        path: '/throttle/burstLimit',
                                        value: `${usagePlan.throttle.burstLimit}`,
                                    });
                                }

                                if (usagePlan.quota?.limit) {
                                    patchOperations.push({
                                        op: 'replace',
                                        path: '/quota/limit',
                                        value: `${usagePlan.quota.limit}`,
                                    });
                                }

                                if (usagePlan.quota?.period) {
                                    patchOperations.push({
                                        op: 'replace',
                                        path: '/quota/period',
                                        value: `${usagePlan.quota.period}`,
                                    });
                                }

                                await apiGatewayClient.send(
                                    new UpdateUsagePlanCommand({
                                        usagePlanId: usagePlanResponse.id,
                                        patchOperations,
                                    })
                                );
                                console.log('ApiGateway -> Usage plan updated:', usagePlan.name);
                            } else {
                                usagePlanResponse = await apiGatewayClient.send(
                                    new CreateUsagePlanCommand({
                                        name: usagePlan.name,
                                        description: usagePlan.description,
                                        apiStages: [{ apiId: existingApi.id, stage: api.stage }],
                                        throttle: usagePlan.throttle,
                                        quota: usagePlan.quota,
                                    })
                                );
                                console.log('ApiGateway -> Usage plan created:', usagePlan.name);
                            }
                            return usagePlanResponse;
                        })(usagePlan)
                    )
                );

                await Promise.all(
                    api.apiKeys.map((apiKey) =>
                        (async (apiKey) => {
                            const apiKeysResponse = await apiGatewayClient.send(
                                new GetApiKeysCommand({ nameQuery: apiKey.name })
                            );
                            let apiKeyResponse = apiKeysResponse.items?.find((item) => item.name === apiKey.name);
                            if (apiKeyResponse) {
                                await apiGatewayClient.send(
                                    new UpdateApiKeyCommand({
                                        apiKey: apiKeyResponse.id,
                                        patchOperations: [
                                            {
                                                op: 'replace',
                                                path: '/enabled',
                                                value: 'true',
                                            },
                                        ],
                                    })
                                );
                                console.log('ApiGateway -> API key updated:', apiKey.name);
                            } else {
                                apiKeyResponse = await apiGatewayClient.send(
                                    new CreateApiKeyCommand({
                                        name: apiKey.name,
                                        enabled: true,
                                    })
                                );
                                console.log('ApiGateway -> API key created:', apiKey.name);
                            }
                            const index = api.usagePlans.findIndex((usagePlan) => usagePlan.name === apiKey.usagePlanName);
                            const usagePlan = usagePlansResponse[index];
                            if (usagePlan) {
                                await apiGatewayClient
                                    .send(
                                        new CreateUsagePlanKeyCommand({
                                            usagePlanId: usagePlan.id,
                                            keyId: apiKeyResponse.id,
                                            keyType: 'API_KEY',
                                        })
                                    )
                                    .catch((error) => {
                                        // ConflictException is treated as 'key is already attached to usage plan'
                                        // TODO: probably should be check before attach
                                        if (error.name !== 'ConflictException') {
                                            throw error;
                                        }
                                    });
                                console.log('ApiGateway -> API key', apiKey.name, 'attached to', usagePlan.name, 'usage plan');
                            }
                        })(apiKey)
                    )
                );
            }
        }
        console.log('ApiGateway -> succeeded');
    } catch (e) {
        console.log('ApiGateway -> failed:', e);
    }
};

const checkApiExists = async (apiGatewayClient, apiName) => {
    let position;
    do {
        const response = await apiGatewayClient.send(new GetRestApisCommand({ position }));
        const existingApi = response.items?.find((api) => api.name === apiName);
        if (existingApi) {
            return existingApi;
        }
        position = response.position;
    } while (position);
    return null;
};

const buildSwagger = (config, api) => {
    const paths = {};
    for (const endpoint in api.paths) {
        paths[endpoint] = Object.assign({}, buildOptionsConfig());
        for (const method in api.paths[endpoint]) {
            paths[endpoint] = Object.assign(
                paths[endpoint],
                api.paths[endpoint][method].proxy
                    ? buildProxyEndpointConfig({
                          method,
                          lambda: api.paths[endpoint][method].lambda,
                          region: config.aws.region,
                          accountId: config.aws.accountId,
                          invokeLambdaRole: config.aws.iam.role.apiGatewayInvokeLambda,
                          auth: api.paths[endpoint][method].auth,
                      })
                    : buildEndpointConfig({
                          method,
                          lambda: api.paths[endpoint][method].lambda,
                          region: config.aws.region,
                          accountId: config.aws.accountId,
                          invokeLambdaRole: config.aws.iam.role.apiGatewayInvokeLambda,
                          auth: api.paths[endpoint][method].auth,
                      })
            );
        }
    }

    return {
        swagger: '2.0',
        info: {
            title: api.name,
            description: api.description,
            version: '1.0.0',
        },
        schemes: ['https'],
        paths,
        securityDefinitions: api.authorizers,
        definitions: {
            Empty: {
                type: 'object',
                title: 'Empty Schema',
            },
        },
        'x-amazon-apigateway-binary-media-types': ['multipart/form-data'],
    };
};
