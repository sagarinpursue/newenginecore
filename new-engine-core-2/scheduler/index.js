import {
    SchedulerClient,
    CreateScheduleCommand,
    GetScheduleCommand,
    CreateScheduleGroupCommand,
    GetScheduleGroupCommand,
} from '@aws-sdk/client-scheduler';

import { getFiles, awsExceptions } from '../utils.js';

const MODULE_DIR = 'scheduler';

export default async (environment) => {
    console.log('scheduler -> started');

    const config = (await import(`../.environment/${environment}/config.js`)).default;
    const schedulerClient = new SchedulerClient({
        profile: config.aws.profile,
        region: config.aws.region,
    });

    try {
        const folder = 'list';

        const files = await getFiles(`./${MODULE_DIR}/${folder}`);
        console.log('scheduler -> files:', files);
        const schedulerList = (await Promise.all(files.map((file) => (async (file) => import(`./${folder}/${file}`))(file)))).map(
            (module) => module.default(config)
        );

        const existingSchedulerGroups = new Set();

        for (const scheduler of schedulerList) {
            console.log('scheduler -> schedulerGroup.name:', scheduler.groupName);

            if (!scheduler.name) {
                console.log('scheduler -> skipped');
                continue;
            }

            if (!existingSchedulerGroups.has(scheduler.groupName)) {
                try {
                    await schedulerClient.send(new GetScheduleGroupCommand({ Name: scheduler.groupName }));
                } catch (error) {
                    if (error.name === awsExceptions.RESOURCE_NOT_FOUND_EXCEPTION) {
                        await schedulerClient.send(new CreateScheduleGroupCommand({ Name: scheduler.groupName }));
                    } else {
                        throw error;
                    }
                } finally {
                    existingSchedulerGroups.add(scheduler.groupName);
                }
            }

            console.log('scheduler -> role.name:', scheduler.name);

            const existingScheduler = await schedulerClient
                .send(new GetScheduleCommand({ Name: scheduler.name, GroupName: scheduler.groupName }))
                .catch((err) => {
                    console.error(err);

                    if (err.name === awsExceptions.RESOURCE_NOT_FOUND_EXCEPTION) {
                        return null;
                    }
                    return true;
                });
            console.log('scheduler -> existing:', !!existingScheduler);
            if (existingScheduler) {
                console.log('scheduler -> Skip create');
                continue;
            }

            console.log('scheduler -> create');
            await schedulerClient.send(
                new CreateScheduleCommand({
                    Name: scheduler.name,
                    ScheduleExpression: scheduler.scheduleExpression,
                    FlexibleTimeWindow: {
                        Mode: 'OFF',
                    },
                    State: 'ENABLED',
                    GroupName: scheduler.groupName,
                    Target: {
                        Arn: scheduler.targetArn,
                        RoleArn: scheduler.targetRoleArn,
                        RetryPolicy: {
                            // RetryPolicy
                            MaximumEventAgeInSeconds: 900,
                            MaximumRetryAttempts: 5,
                        },
                    },
                })
            );
            console.log('scheduler -> created:');
        }
        console.log('scheduler -> succeeded');
    } catch (e) {
        console.log('scheduler -> failed:', e);
    }
};
