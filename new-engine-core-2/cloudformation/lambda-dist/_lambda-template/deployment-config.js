export default async (config) => {
    const appName = config.appName;
    const dbApiUrl = config.dbApi.url;
    const dbApiKey = config.dbApi.anonKey;
    const environment = config.environment;
    const accountId = config.aws.accountId;
    const lambdaName = null; // FIXME: add lambdaName to config and write it right here too
    const lambdaRole = null; // FIXME: add lambdaRole to config and write it right here too

    return {
        name: lambdaName,
        runtime: 'nodejs22.x',
        handler: 'index.handler',
        role: `arn:aws:iam::${accountId}:role/${lambdaRole}`,
        timeout: 60,
        memory: 512,
        environmentVariables: {
            DB_API_URL: dbApiUrl,
            DB_API_KEY: dbApiKey,
            APP_NAME: appName,
            ENV: environment,
        },
    };
};
