export default (config) => {
    const appName = config.appName;
    const environment = config.environment;
    const accountId = config.aws.accountId;
    const region = config.aws.region;
    const roleName = config.aws.iam.role.lambdaLlmStructureNoFrameworkProcessing;
    const bucketName = config.aws.s3.core?.name;
    const llmDataSourcesFolder = config.aws.s3.core.llmDataSourcesFolder;
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
        inlinePolicyName: `Access-${environment}`,
        inlinePolicyDocument: {
            Version: '2012-10-17',
            Statement: [
                {
                    Effect: 'Allow',
                    Action: 'bedrock:InvokeModel',
                    Resource: [
                        `arn:aws:bedrock:*::foundation-model/*`,
                        `arn:aws:bedrock:${region}:${accountId}:inference-profile/*`,
                    ],
                },
                {
                    Effect: 'Allow',
                    Action: 'bedrock:Retrieve',
                    Resource: `arn:aws:bedrock:${region}:${accountId}:knowledge-base/*`,
                },
                {
                    Effect: 'Allow',
                    Action: 'lambda:InvokeFunction',
                    Resource: `arn:aws:lambda:${region}:${accountId}:function:${appName}-llm-structure-no-framework-processing-${environment}`,
                },
                {
                    Effect: 'Allow',
                    Action: 's3:GetObject',
                    Resource: `arn:aws:s3:::${bucketName}/${llmDataSourcesFolder}/*`,
                },
                {
                    Effect: 'Allow',
                    Action: 's3:ListBucket',
                    Resource: `arn:aws:s3:::${bucketName}`,
                },
            ],
        },
    };
};
