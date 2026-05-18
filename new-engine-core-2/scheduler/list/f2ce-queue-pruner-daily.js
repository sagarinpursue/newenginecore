export default (config) => {
    return {
        name: config.aws.scheduler?.ceCronQueuePrunerDaily,
        groupName: 'F2CE-Schedulers',
        scheduleExpression: 'cron(0 0 * * ? *)',
        targetArn: `arn:aws:lambda:${config.aws.region}:${config.aws.accountId}:function:${config.aws.lambda.cronQueuePruner}`,
        targetRoleArn: `arn:aws:iam::${config.aws.accountId}:role/${config.aws.iam.role.schedulerQueuePruner}`,
    };
};
