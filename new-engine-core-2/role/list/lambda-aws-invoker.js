export default (config) => {
    const environment = config.environment;
    const region = config.aws.region;
    const accountId = config.aws.accountId;
    const roleName = config.aws.iam.role.lambdaAwsInvoker;

    return {
        name: roleName,
        managedPolicies: [
            'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
            'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',
            'arn:aws:iam::aws:policy/AWSXrayWriteOnlyAccess',
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
        inlinePolicyName: `Access-${environment}`,
        inlinePolicyDocument: {
            Version: '2012-10-17',
            Statement: [
                {
                    Effect: 'Allow',
                    Action: ['bedrock:StartIngestionJob', 'bedrock:GetIngestionJob'],
                    Resource: `arn:aws:bedrock:${region}:${accountId}:knowledge-base/*`,
                },
                {
                    Effect: 'Allow',
                    Action: ['bedrock:ListFoundationModels'],
                    Resource: '*',
                },
                {
                    Effect: 'Allow',
                    Action: [
                        'bedrock:ListAgentActionGroups',
                        'bedrock:GetAgentActionGroup',
                        'bedrock:ListAgentCollaborators',
                        'bedrock:GetAgent',
                        'bedrock:ListAgentKnowledgeBases',
                        'bedrock:AssociateAgentKnowledgeBase',
                        'bedrock:UpdateAgentKnowledgeBase',
                        'bedrock:DisassociateAgentKnowledgeBase',
                        'bedrock:CreateAgentActionGroup',
                        'bedrock:UpdateAgentActionGroup',
                        'bedrock:DeleteAgentActionGroup',
                        'bedrock:AssociateAgentCollaborator',
                        'bedrock:UpdateAgentCollaborator',
                        'bedrock:DisassociateAgentCollaborator',
                    ],
                    Resource: '*',
                },
            ],
        },
    };
};
