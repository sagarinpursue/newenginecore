export default (config) => {
    const environment = config.environment;
    const region = config.aws.region;
    const accountId = config.aws.accountId;
    const bucketName = config.aws.s3.core.name;
    const llmDataSourcesFolder = config.aws.s3.core.llmDataSourcesFolder;
    const bedrockRoleName = config.aws.iam.role.bedrock;

    return {
        name: bedrockRoleName,
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
        inlinePolicyName: `KnowledgeBase-Execution-${environment}`,
        inlinePolicyDocument: {
            Version: '2012-10-17',
            Statement: [
                {
                    Effect: 'Allow',
                    Action: 'bedrock:InvokeModel',
                    Resource: `arn:aws:bedrock:${region}::foundation-model/*`,
                },
                {
                    Effect: 'Allow',
                    Action: 'aoss:APIAccessAll',
                    Resource: `arn:aws:aoss:${region}:${accountId}:collection/*`,
                },
                {
                    Effect: 'Allow',
                    Action: 's3:ListBucket',
                    Resource: `arn:aws:s3:::${bucketName}`,
                },
                {
                    Effect: 'Allow',
                    Action: ['s3:GetObject', 's3:PutObject'],
                    Resource: `arn:aws:s3:::${bucketName}/${llmDataSourcesFolder}/*`,
                },
                {
                    Effect: 'Allow',
                    Action: [
                        's3vectors:GetIndex',
                        's3vectors:QueryVectors',
                        's3vectors:PutVectors',
                        's3vectors:GetVectors',
                        's3vectors:DeleteVectors',
                    ],
                    Resource: `arn:aws:s3vectors:${region}:${accountId}:bucket/*`,
                },
            ],
        },
    };
};
