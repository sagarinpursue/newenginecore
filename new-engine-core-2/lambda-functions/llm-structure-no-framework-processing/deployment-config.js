export default async (config) => {
    const dbApiUrl = config.dbApi.url;
    const jwtAuthSecret = config.aws.secretsManager.jwtAuthSecret;
    const accountId = config.aws.accountId;
    const lambdaName = config.aws.lambda.llmStructureNoFrameworkProcessing;
    const lambdaRole = config.aws.iam.role.lambdaLlmStructureNoFrameworkProcessing;
    const bucketName = config.aws.s3.core.name;
    const dataSourceFolder = config.aws.s3.core.llmDataSourcesFolder;

    return {
        name: lambdaName,
        runtime: 'nodejs22.x',
        handler: 'index.handler',
        role: `arn:aws:iam::${accountId}:role/${lambdaRole}`,
        timeout: 30,
        memory: 512,
        layers: ['f2-common-layer'],
        environmentVariables: {
            ACCOUNT_ID: accountId,
            DB_API_URL: dbApiUrl,
            JWT_AUTHORIZER_SECRET: jwtAuthSecret,
            BUCKET_NAME: bucketName,
            DATA_SOURCE_FOLDER: dataSourceFolder,
        },
    };
};
