export default async (config) => {
    const accountId = config.aws.accountId;
    const lambdaName = config.aws.lambda.cxChannelPost;
    const lambdaRole = config.aws.iam.role.lambdaCxChannel;
    const dbApiUrl = config.dbApi.url;
    const jwtAuthSecret = config.aws.secretsManager.jwtAuthSecret;
    const bucketName = config.aws.s3.core.name;
    const cxChannelsFolder = config.aws.s3.core.cxChannelsFolder;

    return {
        name: lambdaName,
        runtime: 'nodejs22.x',
        handler: 'index.handler',
        role: `arn:aws:iam::${accountId}:role/${lambdaRole}`,
        timeout: 30,
        memory: 512,
        layers: ['f2-common-layer'],
        environmentVariables: {
            DB_API_URL: dbApiUrl,
            JWT_AUTHORIZER_SECRET: jwtAuthSecret,
            BUCKET_NAME: bucketName,
            CX_CHANNELS_FOLDER: cxChannelsFolder,
        },
    };
};
