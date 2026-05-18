export default (config) => {
    const environment = config.environment;
    const lambdaArn = `arn:aws:lambda:${config.aws.region}:${config.aws.accountId}:function:${config.aws.lambda.cronQueuePruner}`;

    return {
        name: config.aws.iam.role.schedulerQueuePruner,
        managedPolicies: [],
        assumeRolePolicyDocument: {
            Version: '2012-10-17',
            Statement: [
                {
                    Action: 'sts:AssumeRole',
                    Effect: 'Allow',
                    Principal: {
                        Service: 'scheduler.amazonaws.com',
                    },
                },
            ],
        },
        inlinePolicyName: `Policy-Scheduler-Invoke-Target-Lambda-${environment}`,
        inlinePolicyDocument: {
            Version: '2012-10-17',
            Statement: [
                {
                    Effect: 'Allow',
                    Action: ['lambda:InvokeFunction'],
                    Resource: [`${lambdaArn}:*`, lambdaArn],
                },
            ],
        },
    };
};
