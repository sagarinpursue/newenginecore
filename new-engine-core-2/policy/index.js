import path from 'path';
import { fileURLToPath } from 'url';

import {
    IAMClient,
    GetPolicyCommand,
    CreatePolicyCommand,
    CreatePolicyVersionCommand,
    ListPolicyVersionsCommand,
    DeletePolicyVersionCommand,
} from '@aws-sdk/client-iam';

import { getFiles, awsExceptions } from '../utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async (environment) => {
    console.log('Policy -> started');

    const config = (await import(`../.environment/${environment}/config.js`)).default;
    const iamClient = new IAMClient({
        profile: config.aws.profile,
        region: config.aws.region,
    });

    try {
        const folders = ['list'];

        for (const folder of folders) {
            console.log('Policy -> folder:', folder);
            const files = await getFiles(path.join(__dirname, folder));
            console.log('Policy -> files:', files);
            const policyList = (
                await Promise.all(files.map((file) => (async (file) => import(path.join(__dirname, folder, file)))(file)))
            ).map((module) => module.default(config));

            for (const policy of policyList) {
                console.log('Policy -> policy.name:', policy.name);
                if (!policy.name) {
                    console.log('Policy -> skipped');
                    continue;
                }

                const policyArn = `arn:aws:iam::${config.aws.accountId}:policy/${policy.name}`;
                console.log('Policy -> policyArn:', policyArn);
                const existingPolicy = await iamClient.send(new GetPolicyCommand({ PolicyArn: policyArn })).catch((err) => {
                    if (err.name === awsExceptions.NO_SUCH_ENTITY_EXCEPTION) {
                        return null;
                    }
                    throw err;
                });
                console.log('Policy -> existingPolicy:', !!existingPolicy);
                if (existingPolicy) {
                    console.log('Policy -> update');
                    await iamClient.send(
                        new CreatePolicyVersionCommand({
                            PolicyArn: policyArn,
                            PolicyDocument: JSON.stringify(policy.policyDocument),
                            SetAsDefault: true,
                        })
                    );
                    const { Versions: policyVersions } = await iamClient.send(
                        new ListPolicyVersionsCommand({
                            PolicyArn: policyArn,
                        })
                    );
                    console.log('Policy -> policyVersions:', policyVersions);
                    const notDefaultVersions = policyVersions.filter((version) => !version.IsDefaultVersion);
                    console.log('Policy -> notDefaultVersions:', notDefaultVersions);
                    await Promise.all(
                        notDefaultVersions.map((version) =>
                            iamClient.send(
                                new DeletePolicyVersionCommand({
                                    PolicyArn: policyArn,
                                    VersionId: version.VersionId,
                                })
                            )
                        )
                    );
                    console.log('Policy -> notDefaultVersions removed');
                } else {
                    console.log('Policy -> create');
                    const policyResponse = await iamClient.send(
                        new CreatePolicyCommand({
                            PolicyName: policy.name,
                            PolicyDocument: JSON.stringify(policy.policyDocument),
                        })
                    );
                    console.log('Policy -> created:', policyResponse.Policy.Arn);
                }
            }
        }
        console.log('Policy -> succeeded');
    } catch (e) {
        console.log('Policy -> failed:', e);
    }
};
