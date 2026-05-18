export default (config) => {
    const accountId = config.aws.accountId;
    const region = config.aws.region;
    const bedrockAgentRoleName = config.aws.iam.role.bedrockAgent;

    return {
        name: bedrockAgentRoleName,
        managedPolicies: [],
        assumeRolePolicyDocument: {
            Version: '2012-10-17',
            Statement: [
                {
                    Action: 'sts:AssumeRole',
                    Effect: 'Allow',
                    Principal: {
                        Service: 'bedrock.amazonaws.com',
                    },
                },
            ],
        },
        inlinePolicyName: 'access-policy',
        inlinePolicyDocument: {
            Version: '2012-10-17',
            Statement: [
                {
                    Effect: 'Allow',
                    Action: ['bedrock:InvokeModel', 'bedrock:InvokeModelWithResponseStream'],
                    Resource: [`arn:aws:bedrock:${region}::foundation-model/*`],
                },
                {
                    Effect: 'Allow',
                    Action: [
                        'bedrock:InvokeModel',
                        'bedrock:InvokeModelWithResponseStream',
                        'bedrock:GetInferenceProfile',
                        'bedrock:GetFoundationModel',
                    ],
                    Resource: [
                        `arn:aws:bedrock:${region}:${accountId}:inference-profile/*`,
                        'arn:aws:bedrock:*::foundation-model/*',
                    ],
                },
                {
                    Effect: 'Allow',
                    Action: ['bedrock:Retrieve'],
                    Resource: [`arn:aws:bedrock:${region}:${accountId}:knowledge-base/*`],
                },
                {
                    Effect: 'Allow',
                    Action: ['bedrock:GetAgentAlias', 'bedrock:InvokeAgent'],
                    Resource: [`arn:aws:bedrock:${region}:${accountId}:agent-alias/*`],
                },
            ],
        },
    };
};
