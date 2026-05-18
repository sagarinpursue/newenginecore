import path from 'path';
import { fileURLToPath } from 'url';

import {
    LambdaClient,
    GetFunctionCommand,
    CreateFunctionCommand,
    UpdateFunctionCodeCommand,
    UpdateFunctionConfigurationCommand,
    GetPolicyCommand,
    RemovePermissionCommand,
    AddPermissionCommand,
    ListLayersCommand,
} from '@aws-sdk/client-lambda';

import { getDirs, zipDirectory, removeFile, execPromise, removeDir, getFile, awsExceptions } from '../utils.js';
// import { copyDir, linkDir } from '../utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SHARED_MODULES_DIR = '_shared-modules';

export default async (environment, isThisDirOnly) => {
    console.log('Lambda Functions -> started');

    const config = (await import(`../.environment/${environment}/config.js`)).default;
    const lambdaClient = new LambdaClient({
        profile: config.aws.profile,
        region: config.aws.region,
    });

    const layers = await getLayers(lambdaClient);
    const directories = isThisDirOnly ? [path.basename(process.cwd())] : await getDirs(__dirname, [SHARED_MODULES_DIR]);

    for (const directory of directories) {
        try {
            console.log('Lambda Functions -> directory:', directory);
            const functionDirPath = isThisDirOnly ? process.cwd() : path.join(__dirname, directory);
            const deploymentConfig = await (await import(path.join(functionDirPath, 'deployment-config.js'))).default(config);
            console.log('Lambda Functions -> deploymentConfig:', deploymentConfig);

            if (!deploymentConfig.name) {
                console.log('Lambda Functions -> skipped');
                continue;
            }

            // TODO: Transfer locale module in package.json to dependencies
            // await copyDir(path.join(functionDirPath, '..', SHARED_MODULES_DIR), path.join(functionDirPath, SHARED_MODULES_DIR));
            console.log('Lambda Functions -> shared-modules copied');
            await execPromise('npm install --production', { cwd: functionDirPath });
            console.log('Lambda Functions -> node modules installed');
            const zipPath = path.join(__dirname, `${directory}.zip`);
            await zipDirectory(functionDirPath, zipPath);
            console.log('Lambda Functions -> zip created');
            const zipFileBuffer = await getFile(zipPath);

            // CREATE OR UPDATE FUNCTION
            const existingFunction = await lambdaClient
                .send(
                    new GetFunctionCommand({
                        FunctionName: deploymentConfig.name,
                    })
                )
                .catch((err) => {
                    if (err.name === awsExceptions.RESOURCE_NOT_FOUND_EXCEPTION) {
                        return null;
                    }
                    throw err;
                });
            if (existingFunction) {
                const params = {
                    FunctionName: deploymentConfig.name,
                    Timeout: deploymentConfig.timeout,
                    MemorySize: deploymentConfig.memory,
                    Runtime: deploymentConfig.runtime,
                    Handler: deploymentConfig.handler,
                    Role: deploymentConfig.role,
                    VpcConfig: {
                        SubnetIds: deploymentConfig.vpc?.subnets || [],
                        SecurityGroupIds: deploymentConfig.vpc?.securityGroups || [],
                    },
                    Environment: {
                        Variables: deploymentConfig.environmentVariables,
                    },
                    Layers: deploymentConfig.layers?.map((layerName) => layers[layerName])?.filter(Boolean) || [],
                };
                await lambdaClient.send(new UpdateFunctionConfigurationCommand(params));
                await waitForFunctionUpdated(lambdaClient, deploymentConfig.name);
                console.log('Lambda Functions -> lambda function configuration updated');
                await new Promise((resolve) => setTimeout(resolve, 1000));
                await lambdaClient.send(
                    new UpdateFunctionCodeCommand({
                        FunctionName: deploymentConfig.name,
                        ZipFile: zipFileBuffer,
                    })
                );
                console.log('Lambda Functions -> lambda function code updated');
            } else {
                const params = {
                    FunctionName: deploymentConfig.name,
                    Timeout: deploymentConfig.timeout,
                    MemorySize: deploymentConfig.memory,
                    Runtime: deploymentConfig.runtime,
                    Handler: deploymentConfig.handler,
                    Code: { ZipFile: zipFileBuffer },
                    Role: deploymentConfig.role,
                    VpcConfig: {
                        SubnetIds: deploymentConfig.vpc?.subnets || [],
                        SecurityGroupIds: deploymentConfig.vpc?.securityGroups || [],
                    },
                    Environment: {
                        Variables: deploymentConfig.environmentVariables,
                    },
                    Layers: deploymentConfig.layers?.map((layerName) => layers[layerName])?.filter(Boolean) || [],
                };
                await lambdaClient.send(new CreateFunctionCommand(params));
                console.log('Lambda Functions -> lambda function created');
            }

            // UPDATE PERMISSIONS
            // 1. Remove all current permissions (if exist)
            const existingPolicy = await lambdaClient
                .send(
                    new GetPolicyCommand({
                        FunctionName: deploymentConfig.name,
                    })
                )
                .catch((err) => {
                    if (err.name === awsExceptions.RESOURCE_NOT_FOUND_EXCEPTION) {
                        return null;
                    }
                    throw err;
                });
            if (existingPolicy?.Policy) {
                const policy = JSON.parse(existingPolicy?.Policy);
                await Promise.all(
                    policy.Statement?.map((s) =>
                        lambdaClient.send(
                            new RemovePermissionCommand({
                                FunctionName: deploymentConfig.name,
                                StatementId: s.Sid,
                            })
                        )
                    ) || []
                );
            }
            // 2. Add all new permissions (if defined)
            await Promise.all(
                deploymentConfig.permissions?.map((permission) =>
                    lambdaClient.send(
                        new AddPermissionCommand({
                            FunctionName: deploymentConfig.name,
                            StatementId: permission.statementId,
                            Action: permission.action,
                            Principal: permission.principal,
                            SourceArn: permission.sourceArn,
                        })
                    )
                ) || []
            );
            console.log('Lambda Functions -> lambda permissions updated');

            await removeFile(zipPath);
            console.log('Lambda Functions -> zip removed');
            await removeDir(path.join(functionDirPath, 'node_modules'));
            console.log('Lambda Functions -> node modules removed');
            // TODO: Transfer locale module in package.json to dependencies
            // await linkDir(path.join(functionDirPath, '..', SHARED_MODULES_DIR), path.join(functionDirPath, SHARED_MODULES_DIR));
            console.log('Lambda Functions -> shared modules linked');
        } catch (e) {
            console.log('Lambda Functions -> failed:', e);
        }
    }

    console.log('Lambda Functions -> completed');
};

async function waitForFunctionUpdated(lambdaClient, functionName, timeout = 300000, delay = 5000) {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
        const result = await lambdaClient.send(
            new GetFunctionCommand({
                FunctionName: functionName,
            })
        );
        if (result.Configuration && result.Configuration.State === 'Active') {
            return;
        }
        // Wait for the specified delay before retrying
        console.log(`Waiting for function ${functionName} to be updated...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
    }
    throw new Error(`Timeout reached. Lambda function ${functionName} was not updated within the allotted time.`);
}

async function getLayers(lambdaClient) {
    const layers = {};

    let nextMarker;
    do {
        const command = new ListLayersCommand({ Marker: nextMarker });
        const response = await lambdaClient.send(command);

        if (response.Layers) {
            for (const layer of response.Layers) {
                if (layer.LayerName && layer.LatestMatchingVersion) {
                    layers[layer.LayerName] = layer.LatestMatchingVersion.LayerVersionArn;
                }
            }
        }
        nextMarker = response.NextMarker;
    } while (nextMarker);

    return layers;
}
