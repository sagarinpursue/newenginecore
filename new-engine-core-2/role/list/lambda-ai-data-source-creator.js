export default (config) => {
    const environment = config.environment;
    const region = config.aws.region;
    const accountId = config.aws.accountId;
    const roleName = config.aws.iam.role.lambdaAiDataSourceCreator;
    const bedrockRoleName = config.aws.iam.role.bedrock;
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
                    Action: [
                        'aoss:CreateAccessPolicy',
                        'aoss:CreateSecurityPolicy',
                        'aoss:CreateCollection',
                        'aoss:BatchGetCollection',
                        'aoss:CreateIndex',
                    ],
                    Resource: '*', // it doesn't work if specify `arn:aws:aoss:${region}:${accountId}:collection/*`
                },
                {
                    Effect: 'Allow',
                    Action: 'aoss:APIAccessAll',
                    Resource: `arn:aws:aoss:${region}:${accountId}:collection/*`,
                },
                {
                    Effect: 'Allow',
                    Action: [
                        'bedrock:ListDataSources',
                        'bedrock:GetDataSource',
                        'bedrock:GetKnowledgeBase',
                        'bedrock:CreateKnowledgeBase',
                        'bedrock:CreateDataSource',
                    ],
                    Resource: `arn:aws:bedrock:${region}:${accountId}:knowledge-base/*`,
                },
                {
                    Effect: 'Allow',
                    Action: 'iam:PassRole',
                    Resource: `arn:aws:iam::${accountId}:role/${bedrockRoleName}`,
                },
                {
                    Effect: 'Allow',
                    Action: 'lambda:InvokeFunction',
                    Resource: `arn:aws:lambda:${region}:${accountId}:function:${lambdaName}`,
                },
                {
                    Effect: 'Allow',
                    Action: ['s3vectors:CreateVectorBucket', 's3vectors:CreateIndex'],
                    Resource: `arn:aws:s3vectors:${region}:${accountId}:bucket/*`,
                },
            ],
        },
    };
};
