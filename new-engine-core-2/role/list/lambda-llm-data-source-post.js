export default (config) => {
    const environment = config.environment;
    const region = config.aws.region;
    const accountId = config.aws.accountId;
    const roleName = config.aws.iam.role.lambdaLlmDataSourcePost;
    const lambdaName = config.aws.lambda.aiDataSourceCreator;
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
                    Action: ['bedrock:GetKnowledgeBase', 'bedrock:ListDataSources', 'bedrock:GetDataSource'],
                    Resource: `arn:aws:bedrock:${region}:${accountId}:knowledge-base/*`,
                },
                {
                    Effect: 'Allow',
                    Action: 'lambda:InvokeFunction',
                    Resource: `arn:aws:lambda:${region}:${accountId}:function:${lambdaName}`,
                },
            ],
        },
    };
};
