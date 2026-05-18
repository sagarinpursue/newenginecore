export default (config) => {
    const roleName = config.aws.iam.role.ec2Core;

    return {
        name: roleName,
        managedPolicies: ['arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess'],
        assumeRolePolicyDocument: {
            Version: '2012-10-17',
            Statement: [
                {
                    Effect: 'Allow',
                    Action: 'sts:AssumeRole',
                    Principal: {
                        Service: 'ec2.amazonaws.com',
                    },
                },
            ],
        },
    };
};
