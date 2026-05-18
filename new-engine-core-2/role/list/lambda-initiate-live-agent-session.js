export default (config) => {
    const environment = config.environment;
    const roleName = config.aws.iam.role.lambdaInitiateLiveAgentSession;

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
        inlinePolicyName: `Lambda-Live-Agent-Policy-${environment}`,
        inlinePolicyDocument: {
            Version: '2012-10-17',
            Statement: [
                {
                    Effect: 'Allow',
                    Action: 'connect:StartChatContact',
                    Resource: '*',
                },
                {
                    Effect: 'Allow',
                    Action: 'connect:StartContactStreaming',
                    Resource: '*',
                },
                {
                    Effect: 'Allow',
                    Action: 'secretsmanager:GetSecretValue',
                    Resource: '*',
                },
            ],
        },
    };
};
