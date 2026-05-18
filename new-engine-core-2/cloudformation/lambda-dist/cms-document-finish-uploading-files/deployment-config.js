export default async (config) => {
    const appName = config.appName;
    const dbApiUrl = config.dbApi.url;
    const jwtAuthSecret = config.aws.secretsManager.jwtAuthSecret;
    const environment = config.environment;
    const accountId = config.aws.accountId;
    const lambdaName = config.aws.lambda.cmsDocumentFinishUploadingFiles;
    const lambdaRole = config.aws.iam.role.lambdaCmsDocumentFinishUploadingFiles;
    const coreBucketName = config.aws.s3.core.name;
    const cmsBucketName = config.aws.s3.cms.name;
    const cmsTemporaryFolder = config.aws.s3.core.cmsTemporaryFolder;

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
            CMS_BUCKET: cmsBucketName,
            CORE_BUCKET: coreBucketName,
            CMS_TEMP_FOLDER: cmsTemporaryFolder,
        },
    };
};
