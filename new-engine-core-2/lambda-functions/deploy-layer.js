import path from 'path';
import { fileURLToPath } from 'url';

import { LambdaClient, PublishLayerVersionCommand } from '@aws-sdk/client-lambda';

import { zipDirectory, removeFile, getFile, getEnvironment, execPromise, removeDir } from '../utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const environment = await getEnvironment();
console.log('environment: ', environment);

await deployLayer(environment);

async function deployLayer(environment) {
    console.log('Lambda Layers -> started');

    const config = (await import(`../.environment/${environment}/config.js`)).default;
    const lambdaClient = new LambdaClient({
        profile: config.aws.profile,
        region: config.aws.region,
    });
    const directory = path.basename(process.cwd());
    console.log('Lambda Layers -> directory:', directory);

    try {
        const layerDirPath = process.cwd();

        const deploymentConfig = await (await import(path.join(layerDirPath, 'deployment-config.js'))).default(config);
        console.log('Lambda Layers -> deploymentConfig:', deploymentConfig);

        if (!deploymentConfig.name) {
            console.log('Lambda Layers -> skipped');
            return;
        }

        await execPromise('npm install --production', { cwd: path.join(layerDirPath, 'nodejs') });
        console.log('Lambda Layers -> node modules installed');

        const zipPath = path.join(__dirname, `${directory}.zip`);
        await zipDirectory(layerDirPath, zipPath);
        console.log('Lambda Layers -> zip created');

        const zipFileBuffer = await getFile(zipPath);

        await lambdaClient.send(
            new PublishLayerVersionCommand({
                LayerName: deploymentConfig.name,
                Content: {
                    ZipFile: zipFileBuffer,
                },
                CompatibleRuntimes: deploymentConfig.compatibleRuntimes,
            })
        );
        console.log('Lambda Layers -> published');

        await removeFile(zipPath);
        console.log('Lambda Layers -> zip removed');
        await removeDir(path.join(layerDirPath, 'node_modules', 'nodejs'));
        console.log('Lambda Layers -> node modules removed');
    } catch (e) {
        console.log('Lambda Layers -> failed:', e);
    }

    console.log('Lambda Layers -> completed');
}
