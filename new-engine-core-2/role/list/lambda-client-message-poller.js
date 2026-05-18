export default (config) => {
    const environment = config.environment;
    const roleName = config.aws.iam.role.lambdaClientMessagePoller;

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
        inlinePolicyName: `SQS-Receive-Policy-${environment}`,
        inlinePolicyDocument: {
            Version: '2012-10-17',
            Statement: [
                {
                    Effect: 'Allow',
                    Action: ['sqs:ReceiveMessage', 'sqs:DeleteMessage'],
                    Resource: '*',
                },
            ],
        },
    };
};
