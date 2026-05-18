import path from 'path';
import { fileURLToPath } from 'url';

import {
    IAMClient,
    GetRoleCommand,
    CreateRoleCommand,
    UpdateRoleCommand,
    AttachRolePolicyCommand,
    PutRolePolicyCommand,
} from '@aws-sdk/client-iam';

import { getFiles, awsExceptions } from '../utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async (environment) => {
    console.log('Role -> started');

    const config = (await import(`../.environment/${environment}/config.js`)).default;
    const iamClient = new IAMClient({
        profile: config.aws.profile,
        region: config.aws.region,
    });

    try {
        const folders = ['list'];

        for (const folder of folders) {
            console.log('Role -> folder:', folder);
            const files = await getFiles(path.join(__dirname, folder));
            console.log('Role -> files:', files);
            const roleList = (
                await Promise.all(files.map((file) => (async (file) => import(path.join(__dirname, folder, file)))(file)))
            ).map((module) => module.default(config));

            for (const role of roleList) {
                console.log('Role -> role.name:', role.name);
                if (!role.name) {
                    console.log('Role -> skipped');
                    continue;
                }

                const existingRole = await iamClient.send(new GetRoleCommand({ RoleName: role.name })).catch((err) => {
                    if (err.name === awsExceptions.NO_SUCH_ENTITY_EXCEPTION) {
                        return null;
                    }
                    throw err;
                });
                console.log('Role -> existingRole:', !!existingRole);
                if (existingRole) {
                    console.log('Role -> update');
                    await iamClient.send(
                        new UpdateRoleCommand({
                            RoleName: role.name,
                            AssumeRolePolicyDocument: JSON.stringify(role.assumeRolePolicyDocument),
                        })
                    );
                } else {
                    console.log('Role -> create');
                    const roleResponse = await iamClient.send(
                        new CreateRoleCommand({
                            RoleName: role.name,
                            AssumeRolePolicyDocument: JSON.stringify(role.assumeRolePolicyDocument),
                        })
                    );
                    console.log('Role -> created:', roleResponse.Role.Arn);
                }
                if (role.managedPolicies?.length) {
                    for (const policyArn of role.managedPolicies) {
                        await iamClient.send(
                            new AttachRolePolicyCommand({
                                RoleName: role.name,
                                PolicyArn: policyArn,
                            })
                        );
                        console.log('Role -> attached policy:', policyArn);
                    }
                }
                if (role.inlinePolicyName && role.inlinePolicyDocument) {
                    await iamClient.send(
                        new PutRolePolicyCommand({
                            RoleName: role.name,
                            PolicyName: role.inlinePolicyName,
                            PolicyDocument: JSON.stringify(role.inlinePolicyDocument),
                        })
                    );
                    console.log('Role -> attached inline policy');
                }
            }
        }
        console.log('Role -> succeeded');
    } catch (e) {
        console.log('Role -> failed:', e);
    }
};
