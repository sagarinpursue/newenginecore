export default (config) => {
    const policyName = config.aws.iam.policy.jwtAuthorizerSecretGet;
    const region = config.aws.region;
    const accountId = config.aws.accountId;
    const jwtAuthSecret = config.aws.secretsManager.jwtAuthSecret;

    return {
        name: policyName,
        policyDocument: {
            Version: '2012-10-17',
            Statement: [
                {
                    Effect: 'Allow',
                    Action: 'secretsmanager:GetSecretValue',
                    Resource: `arn:aws:secretsmanager:${region}:${accountId}:secret:${jwtAuthSecret}-*`,
                },
            ],
        },
    };
};
