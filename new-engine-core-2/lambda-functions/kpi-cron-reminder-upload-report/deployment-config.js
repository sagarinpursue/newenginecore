export default async (config) => {
    const accountId = config.aws.accountId;
    const lambdaName = config.aws.lambda.kpiCronReminderUploadReport;
    const lambdaRole = config.aws.iam.role.lambdaKpiCronReminderUploadReport;
    const fromTo = config.aws.ses?.uploadReportReminderFromTo;
    const appName = config.appName;
    const environment = config.environment;

    const dbApiUrl = config.dbApi.url;
    const jwtAuthSecret = config.aws.secretsManager.jwtAuthSecret;

    return {
        name: lambdaName,
        runtime: 'nodejs22.x',
        handler: 'index.handler',
        role: `arn:aws:iam::${accountId}:role/${lambdaRole}`,
        timeout: 30,
        memory: 512,
        layers: ['f2-common-layer'],
        environmentVariables: {
            FROM_TO: fromTo,
            DB_API_URL: dbApiUrl,
            JWT_AUTHORIZER_SECRET: jwtAuthSecret,
            ENV: environment,
            APP_NAME: appName,
            ACCOUNT_ID: accountId,
        },
    };
};
