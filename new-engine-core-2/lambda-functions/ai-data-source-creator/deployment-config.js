export default async (config) => {
    const appName = config.appName;
    const environment = config.environment;
    const dbApiUrl = config.dbApi.url;
    const accountId = config.aws.accountId;
    const jwtAuthSecret = config.aws.secretsManager.jwtAuthSecret;
    const lambdaName = config.aws.lambda.aiDataSourceCreator;
    const lambdaRole = config.aws.iam.role.lambdaAiDataSourceCreator;
    const bucketName = config.aws.s3.core.name;
    const llmDataSourcesFolder = config.aws.s3.core.llmDataSourcesFolder;
    const bedrockRoleName = config.aws.iam.role.bedrock;

    return {
        name: lambdaName,
        runtime: 'nodejs22.x',
        handler: 'index.handler',
        role: `arn:aws:iam::${accountId}:role/${lambdaRole}`,
        timeout: 900,
        memory: 512,
        layers: ['f2-common-layer'],
        environmentVariables: {
            APP_NAME: appName,
            ACCOUNT_ID: accountId,
            ENV: environment,
            BEDROCK_KNOWLEDGE_BASE_ROLE_ARN: `arn:aws:iam::${accountId}:role/${bedrockRoleName}`,
            LAMBDA_DATA_SOURCE_ROLE_ARN: `arn:aws:iam::${accountId}:role/${lambdaRole}`,
            BUCKET_ARN: `arn:aws:s3:::${bucketName}`,
            LLM_DATA_SOURCES_FOLDER: llmDataSourcesFolder,
            DB_API_URL: dbApiUrl,
            JWT_AUTHORIZER_SECRET: jwtAuthSecret,
        },
    };
};
