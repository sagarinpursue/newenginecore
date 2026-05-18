export default (config) => {
    const environment = config.environment;
    const roleName = config.aws.iam.role.lambdaCronQueuePruner;

    return {
        name: roleName,
        managedPolicies: ['arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'],
        assumeRolePolicyDocument: {
            Version: '2012-10-17',
            Statement: [
                {
                    Effect: 'Allow',
                    Action: 'sts:AssumeRole',
                    Principal: {
                        Service: 'lambda.amazonaws.com',
                    },
                },
            ],
        },
        inlinePolicyName: `Lambda-Cron-Queue-Pruner-Policy-${environment}`,
        inlinePolicyDocument: {
            Version: '2012-10-17',
            Statement: [
                {
                    Effect: 'Allow',
                    Action: ['sqs:ListQueues', 'sqs:DeleteQueue'],
                    Resource: '*',
                },
                {
                    Effect: 'Allow',
                    Action: 'cloudwatch:GetMetricStatistics',
                    Resource: '*',
                },
            ],
        },
    };
};
