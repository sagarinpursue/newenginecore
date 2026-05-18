export default (config) => {
    const roleName = config.aws.iam.role.apiGatewayInvokeLambda;

    return {
        name: roleName,
        managedPolicies: ['arn:aws:iam::aws:policy/service-role/AWSLambdaRole'],
        assumeRolePolicyDocument: {
            Version: '2012-10-17',
            Statement: [
                {
                    Effect: 'Allow',
                    Action: 'sts:AssumeRole',
                    Principal: {
                        Service: 'apigateway.amazonaws.com',
                    },
                },
            ],
        },
    };
};
