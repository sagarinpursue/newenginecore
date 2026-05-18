export default async (config) => {
    const appName = config.appName;
    const dbApiUrl = config.dbApi.url;
    const environment = config.environment;
    const accountId = config.aws.accountId;
    const jwtAuthSecret = config.aws.secretsManager.jwtAuthSecret;
    const lambdaName = config.aws.lambda.cxChatSessionCreator;
    const lambdaRole = config.aws.iam.role.lambdaCxChatSessionCreator;

    return {
        name: lambdaName,
        runtime: 'nodejs22.x',
        handler: 'index.handler',
        role: `arn:aws:iam::${accountId}:role/${lambdaRole}`,
        timeout: 60,
        memory: 512,
        layers: ['f2-common-layer'],
        environmentVariables: {
            DB_API_URL: dbApiUrl,
            JWT_AUTHORIZER_SECRET: jwtAuthSecret,
            APP_NAME: appName,
            ENV: environment,
        },
    };
};
