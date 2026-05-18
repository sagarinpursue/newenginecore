export default (config) => {
    return {
        name: config.aws.scheduler?.kpiCronReminderUploadLastDayReport,
        groupName: 'KPI-Schedulers',
        scheduleExpression: 'cron(0 0 L * ? *)',
        targetArn: `arn:aws:lambda:${config.aws.region}:${config.aws.accountId}:function:${config.aws.lambda.kpiCronReminderUploadReport}`,
        targetRoleArn: `arn:aws:iam::${config.aws.accountId}:role/${config.aws.iam.role.schedulerKpiCronReminderUploadReport}`,
    };
};
