export default (config) => {
    const roleName = config.aws.iam.role.lambdaCxChannel;
    const bucketName = config.aws.s3.core?.name;
    const cxChannelsFolder = config.aws.s3.core?.cxChannelsFolder;
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
        inlinePolicyName: `AWS-Access`,
        inlinePolicyDocument: {
            Version: '2012-10-17',
            Statement: [
                {
                    Effect: 'Allow',
                    Action: [
                        'cloudfront:CreateDistribution',
                        'cloudfront:ListOriginAccessControls',
                        'cloudfront:CreateOriginAccessControl',
                        'cloudfront:GetDistributionConfig',
                        'cloudfront:UpdateDistribution',
                    ],
                    Resource: '*',
                },
                {
                    Effect: 'Allow',
                    Action: ['s3:GetBucketPolicy', 's3:PutBucketPolicy', 's3:DeleteBucketPolicy', 's3:ListBucketVersions'],
                    Resource: `arn:aws:s3:::${bucketName}`,
                },
                {
                    Effect: 'Allow',
                    Action: ['s3:DeleteObjects'],
                    Resource: `arn:aws:s3:::${bucketName}/${cxChannelsFolder}/*`,
                },
            ],
        },
    };
};
