export default (config) => {
    const environment = config.environment;
    const coreBucketName = config.aws.s3.core.name;
    const cmsBucketName = config.aws.s3.cms.name;
    const roleName = config.aws.iam.role.lambdaCmsDocumentFinishUploadingFiles;
    const cmsTemporaryFolder = config.aws.s3.core.cmsTemporaryFolder;
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
        inlinePolicyName: `Lambda-S3-Integration-Policy-${environment}`,
        inlinePolicyDocument: {
            Version: '2012-10-17',
            Statement: [
                {
                    Effect: 'Allow',
                    Action: 's3:GetObject',
                    Resource: `arn:aws:s3:::${coreBucketName}/${cmsTemporaryFolder}/*`,
                },
                {
                    Effect: 'Allow',
                    Action: 's3:PutObject',
                    Resource: `arn:aws:s3:::${cmsBucketName}/*`,
                },
            ],
        },
    };
};
