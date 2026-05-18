export default (config) => {
    const environment = config.environment;
    const bucketName = config.aws.s3.core.name;
    const roleName = config.aws.iam.role.lambdaCmsDocumentGeneratePreSignedUrls;
    const cmsTemporaryFolder = config.aws.s3.core.cmsTemporaryFolder;

    return {
        name: roleName,
        managedPolicies: ['arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'],
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
                    Action: 's3:PutObject',
                    Resource: `arn:aws:s3:::${bucketName}/${cmsTemporaryFolder}/*`,
                },
            ],
        },
    };
};
