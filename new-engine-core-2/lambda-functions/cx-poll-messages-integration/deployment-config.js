export default async (config) => {
    const appName = config.appName;
    const environment = config.environment;
    const accountId = config.aws.accountId;
    const lambdaName = config.aws.lambda.clientMessagePoller;
    const lambdaRole = config.aws.iam.role.lambdaClientMessagePoller;

    return {
        name: lambdaName,
        runtime: 'nodejs22.x',
        handler: 'index.handler',
        role: `arn:aws:iam::${accountId}:role/${lambdaRole}`,
        timeout: 30,
        memory: 512,
        layers: ['f2-common-layer'],
        environmentVariables: {
            APP_NAME: appName,
            ENV: environment,
            ACCOUNT_ID: accountId,
        },
    };
};
