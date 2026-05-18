export default async (config) => {
    const appName = config.appName;
    const region = config.aws.region;
    const dbApiUrl = config.dbApi.url;
    const jwtAuthSecret = config.aws.secretsManager.jwtAuthSecret;
    const environment = config.environment;
    const accountId = config.aws.accountId;
    const lambdaName = config.aws.lambda.initiateLiveAgentSession;
    const lambdaRole = config.aws.iam.role.lambdaInitiateLiveAgentSession;

    return {
        name: lambdaName,
        runtime: 'nodejs22.x',
        handler: 'index.handler',
        role: `arn:aws:iam::${accountId}:role/${lambdaRole}`,
        timeout: 30,
        memory: 512,
        layers: ['f2-common-layer'],
        environmentVariables: {
            ENV: environment,
            APP_NAME: appName,
            DB_API_URL: dbApiUrl,
            JWT_AUTHORIZER_SECRET: jwtAuthSecret,
            ACCOUNT_ID: accountId,
        },
        permissions: [
            {
                statementId: 'BedrockAgentInvokePermission',
                action: 'lambda:InvokeFunction',
                principal: 'bedrock.amazonaws.com',
                sourceArn: `arn:aws:bedrock:${region}:${accountId}:agent/*`,
            },
        ],
    };
};
