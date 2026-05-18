export default async (config) => {
    const appName = config.appName;
    const environment = config.environment;
    const accountId = config.aws.accountId;
    const lambdaName = config.aws.lambda.requestProcessing;
    const lambdaRole = config.aws.iam.role.lambdaRequestProcessing;

    const dbApiUrl = config.dbApi.url;
    const jwtAuthSecret = config.aws.secretsManager.jwtAuthSecret;
    const tracingLogGroup = 'f2-agent-tracing-logs';

    const llmDataSourcesFolder = config.aws.s3.core.llmDataSourcesFolder;

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
            ENV: environment,
            APP_NAME: appName,
            TRACING_LOG_GROUP: tracingLogGroup,
            LLM_DATA_SOURCES_FOLDER: llmDataSourcesFolder,
        },
    };
};
