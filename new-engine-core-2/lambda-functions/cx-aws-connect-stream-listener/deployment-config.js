export default async (config) => {
    const appName = config.appName;
    const environment = config.environment;

    const dbApiUrl = config.dbApi.url;
    const jwtAuthSecret = config.aws.secretsManager.jwtAuthSecret;

    const accountId = config.aws.accountId;
    const lambdaName = config.aws.lambda.awsConnectStreamListener;
    const lambdaRole = config.aws.iam.role.lambdaAwsConnectStreamListener;

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
            ACCOUNT_ID: accountId,
            DB_API_URL: dbApiUrl,
            JWT_AUTHORIZER_SECRET: jwtAuthSecret,
        },
    };
};
