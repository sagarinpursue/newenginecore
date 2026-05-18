export default async (config) => {
    const appName = config.appName;
    const environment = config.environment;
    const accountId = config.aws.accountId;
    const lambdaName = config.aws.lambda.cmsDocumentGeneratePreSignedUrls;
    const lambdaRole = config.aws.iam.role.lambdaCmsDocumentGeneratePreSignedUrls;
    const bucketName = config.aws.s3.core.name;
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
            APP_NAME: appName,
            ENV: environment,
            CORE_BUCKET: bucketName,
            CMS_TEMP_FOLDER: cmsTemporaryFolder,
        },
    };
};
