export default (config) => {
    const accountId = config.aws.accountId;
    const roleName = config.aws.iam.role.lambdaCxAiAgentPost;
    const bedrockAgentRoleName = config.aws.iam.role.bedrockAgent;
    const jwtAuthorizerSecretGetPolicy = config.aws.iam.policy.jwtAuthorizerSecretGet;

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
        inlinePolicyName: `AWS-Access`,
        inlinePolicyDocument: {
            Version: '2012-10-17',
            Statement: [
                {
                    Effect: 'Allow',
                    Action: [
                        'bedrock:CreateAgent',
                        'bedrock:CreateAgentAlias',
                        'bedrock:GetAgent',
                        'bedrock:GetAgentAlias',
                        'bedrock:PrepareAgent',
                    ],
                    Resource: '*',
                },
                {
                    Effect: 'Allow',
                    Action: 'iam:PassRole',
                    Resource: `arn:aws:iam::${accountId}:role/${bedrockAgentRoleName}`,
                },
            ],
        },
    };
};
