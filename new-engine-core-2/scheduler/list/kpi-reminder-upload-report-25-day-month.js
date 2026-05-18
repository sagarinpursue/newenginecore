export default (config) => {
    return {
        name: config.aws.scheduler?.kpiCronReminderUpload25DayReport,
        groupName: 'KPI-Schedulers',
        scheduleExpression: 'cron(0 0 25 * ? *)',
        targetArn: `arn:aws:lambda:${config.aws.region}:${config.aws.accountId}:function:${config.aws.lambda.kpiCronReminderUploadReport}`,
        targetRoleArn: `arn:aws:iam::${config.aws.accountId}:role/${config.aws.iam.role.schedulerKpiCronReminderUploadReport}`,
    };
};
