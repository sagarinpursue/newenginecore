export default (config) => {
    const environment = config.environment;
    const region = config.aws.region;
    const accountId = config.aws.accountId;
    const roleName = config.aws.iam.role.lambdaLlmDataSourceDelete;
    const jwtAuthorizerSecretGetPolicy = config.aws.iam.policy.jwtAuthorizerSecretGet;

    return {
        name: roleName,
        managedPolicies: [
            'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
            'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',
            'arn:aws:iam::aws:policy/AWSXrayWriteOnlyAccess',
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
        inlinePolicyName: `DataSource-Access-${environment}`,
        inlinePolicyDocument: {
            Version: '2012-10-17',
            Statement: [
                {
                    Effect: 'Allow',
                    Action: ['aoss:DeleteCollection', 'aoss:DeleteAccessPolicy', 'aoss:DeleteSecurityPolicy'],
                    Resource: '*', // it doesn't work if specify `arn:aws:aoss:${region}:${accountId}:collection/*`
                },
                {
                    Effect: 'Allow',
                    Action: 'aoss:APIAccessAll',
                    Resource: `arn:aws:aoss:${region}:${accountId}:collection/*`,
                },
                {
                    Effect: 'Allow',
                    Action: ['bedrock:DeleteKnowledgeBase'],
                    Resource: `arn:aws:bedrock:${region}:${accountId}:knowledge-base/*`,
                },
                {
                    Effect: 'Allow',
                    Action: ['s3vectors:DeleteVectorBucket', 's3vectors:DeleteIndex'],
                    Resource: `arn:aws:s3vectors:${region}:${accountId}:bucket/*`,
                },
            ],
        },
    };
};
