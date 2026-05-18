export default async (config) => {
    const accountId = config.aws.accountId;
    const lambdaName = config.aws.lambda.awsInvoker;
    const lambdaRole = config.aws.iam.role.lambdaAwsInvoker;

    return {
        name: lambdaName,
        runtime: 'nodejs22.x',
        handler: 'index.handler',
        role: `arn:aws:iam::${accountId}:role/${lambdaRole}`,
        timeout: 30,
        memory: 512,
        layers: ['f2-common-layer'],
    };
};
