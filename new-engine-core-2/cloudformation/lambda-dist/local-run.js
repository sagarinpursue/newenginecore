import path from 'path';

import {
    execPromise,
    getEnvironment,
    removeDir,
    // linkDir
} from '../utils.js';

const environment = await getEnvironment();
console.log('environment: ', environment);
const config = (await import(`../.environment/${environment}/config.js`)).default;
const functionDirPath = process.cwd();

const deploymentConfig = await (await import(path.join(functionDirPath, 'deployment-config.js'))).default(config);
console.log('deploymentConfig:', deploymentConfig);

// const SHARED_MODULES_DIR = '_shared-modules';

// Set ENV vars
if (deploymentConfig.environmentVariables) {
    for (const envVar in deploymentConfig.environmentVariables) {
        process.env[envVar] = deploymentConfig.environmentVariables[envVar];
    }
}

process.env.AWS_REGION = config.aws.region;
process.env.AWS_PROFILE = config.aws.profile;

// await linkDir(path.join('..', SHARED_MODULES_DIR), SHARED_MODULES_DIR);
console.log('shared modules linked');

await execPromise('npm install', { cwd: functionDirPath });
console.log('node modules installed');

const localRunEvent = (await import(path.join(functionDirPath, 'local-run-events', process.env.LOCAL_RUN_EVENT + '.js'))).default;
console.log('localRunEvent:', localRunEvent);

const { handler } = await import(path.join(functionDirPath, 'index.js'));

try {
    const result = await handler(localRunEvent);
    console.log('RESULT:', result);
} catch (e) {
    console.error('ERROR:', e);
}

await removeDir(path.join(functionDirPath, 'node_modules'));
console.log('node modules removed');
