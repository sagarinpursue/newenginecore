export default async (config) => {
    const accountId = config.aws.accountId;
    const lambdaName = config.aws.lambda.jwtTokenAuthorizer;
    const lambdaRole = config.aws.iam.role.lambdaJwtTokenAuthorizer;
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
            JWT_AUTHORIZER_SECRET: jwtAuthSecret,
        },
    };
};
