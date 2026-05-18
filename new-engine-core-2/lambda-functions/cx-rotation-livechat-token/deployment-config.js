export default async (config) => {
    const appName = config.appName;
    const region = config.aws.region;
    const environment = config.environment;
    const accountId = config.aws.accountId;
    const lambdaName = config.aws.lambda.rotationLiveChatToken;
    const lambdaRole = config.aws.iam.role.lambdaRotationLiveChatToken;

    return {
        name: lambdaName,
        runtime: 'nodejs22.x',
        handler: 'index.handler',
        role: `arn:aws:iam::${accountId}:role/${lambdaRole}`,
        timeout: 30,
        memory: 512,
        environmentVariables: {
            ENV: environment,
            APP_NAME: appName,
        },
        layers: ['f2-common-layer'],
        permissions: [
            {
                statementId: 'SecretsManagerInvokePermission',
                action: 'lambda:InvokeFunction',
                principal: 'secretsmanager.amazonaws.com',
                sourceArn: `arn:aws:secretsmanager:${region}:${accountId}:secret:${environment}/lc/*`,
            },
        ],
    };
};
