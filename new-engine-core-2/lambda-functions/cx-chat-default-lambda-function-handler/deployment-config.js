export default async (config) => {
    const accountId = config.aws.accountId;
    const lambdaName = config.aws.lambda.cxChatDefaultLambdaFunctionHandler;
    const lambdaRole = config.aws.iam.role.lambdaCxChatDefaultLambdaFunctionHandler;

    return {
        name: lambdaName,
        runtime: 'nodejs22.x',
        handler: 'index.handler',
        role: `arn:aws:iam::${accountId}:role/${lambdaRole}`,
        timeout: 60,
        memory: 128,
        layers: ['f2-common-layer'],
    };
};
