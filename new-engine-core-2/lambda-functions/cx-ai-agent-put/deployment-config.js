export default async (config) => {
    const appName = config.appName;
    const environment = config.environment;
    const dbApiUrl = config.dbApi.url;
    const accountId = config.aws.accountId;
    const jwtAuthSecret = config.aws.secretsManager.jwtAuthSecret;
    const lambdaName = config.aws.lambda.cxAiAgentPut;
    const lambdaRole = config.aws.iam.role.lambdaCxAiAgentPut;
    const bedrockAgentRoleName = config.aws.iam.role.bedrockAgent;

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
            DB_API_URL: dbApiUrl,
            JWT_AUTHORIZER_SECRET: jwtAuthSecret,
            BEDROCK_AGENT_ROLE_ARN: `arn:aws:iam::${accountId}:role/${bedrockAgentRoleName}`,
        },
    };
};
