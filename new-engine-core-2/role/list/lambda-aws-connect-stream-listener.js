export default (config) => {
    const environment = config.environment;
    const roleName = config.aws.iam.role.lambdaAwsConnectStreamListener;
    const jwtAuthorizerSecretGetPolicy = config.aws.iam.policy.jwtAuthorizerSecretGet;
    const accountId = config.aws.accountId;

    return {
        name: roleName,
        managedPolicies: [
            'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
            `arn:aws:iam::${accountId}:policy/${jwtAuthorizerSecretGetPolicy}`,
        ],
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
        inlinePolicyName: `Invoke-Lambda-Policy-${environment}`,
        inlinePolicyDocument: {
            Version: '2012-10-17',
            Statement: [
                {
                    Effect: 'Allow',
                    Action: 'lambda:InvokeFunction',
                    Resource: '*',
                },
            ],
        },
    };
};
