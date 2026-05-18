export default (config) => {
    const environment = config.environment;
    const accountId = config.aws.accountId;
    const region = config.aws.region;
    const lambdaArn = `arn:aws:lambda:${region}:${accountId}:function:${config.aws.lambda.kpiCronReminderUploadReport}`;
    const jwtAuthorizerSecretGetPolicy = config.aws.iam.policy.jwtAuthorizerSecretGet;

    return {
        name: config.aws.iam.role.schedulerKpiCronReminderUploadReport,
        managedPolicies: [`arn:aws:iam::${accountId}:policy/${jwtAuthorizerSecretGetPolicy}`],
        assumeRolePolicyDocument: {
            Version: '2012-10-17',
            Statement: [
                {
                    Action: 'sts:AssumeRole',
                    Effect: 'Allow',
                    Principal: {
                        Service: 'scheduler.amazonaws.com',
                    },
                },
            ],
        },
        inlinePolicyName: `KPI-Scheduler-Target-Execution-${environment}`,
        inlinePolicyDocument: {
            Version: '2012-10-17',
            Statement: [
                {
                    Effect: 'Allow',
                    Action: ['lambda:InvokeFunction'],
                    Resource: [`${lambdaArn}:*`, lambdaArn],
                },
            ],
        },
    };
};
