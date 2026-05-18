export default async (config) => {
    const appName = config.appName;
    const environment = config.environment;
    const dbApiUrl = config.dbApi.url;
    const accountId = config.aws.accountId;
    const jwtAuthSecret = config.aws.secretsManager.jwtAuthSecret;
    const lambdaName = config.aws.lambda.llmDataSourcePost;
    const lambdaRole = config.aws.iam.role.lambdaLlmDataSourcePost;
    const aiDataSourceCreatorLambdaName = config.aws.lambda.aiDataSourceCreator;
    const llmDataSourcesFolder = config.aws.s3.core.llmDataSourcesFolder;

    return {
        name: lambdaName,
        runtime: 'nodejs22.x',
        handler: 'index.handler',
        role: `arn:aws:iam::${accountId}:role/${lambdaRole}`,
        timeout: 30,
        memory: 512,
        environmentVariables: {
            APP_NAME: appName,
            ENV: environment,
            DB_API_URL: dbApiUrl,
            JWT_AUTHORIZER_SECRET: jwtAuthSecret,
            AI_DATA_SOURCE_CREATOR_LAMBDA_NAME: aiDataSourceCreatorLambdaName,
            LLM_DATA_SOURCES_FOLDER: llmDataSourcesFolder,
        },
        layers: ['f2-common-layer'],
    };
};
