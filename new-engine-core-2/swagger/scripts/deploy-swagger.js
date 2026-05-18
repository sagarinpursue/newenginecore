import { exec } from 'child_process';
import { promisify } from 'util';

import { getEnvironment } from '../../utils.js';

export const deploySwagger = async (environment) => {
    const execAsync = promisify(exec);

    const config = (await import(`../../.environment/${environment}/config.js`)).default;

    // TODO: add bucketName and distributionId to config cause now hardcoded values here
    let bucketName = config.aws.s3.core.name;
    bucketName = 'f2-core-dev'; // TODO: remove this line after testing
    const swaggerFolder = 'swagger';
    const distributionId = config.aws.swagger.distributionId;
    const profileName = config.aws.profile;

    if (!bucketName || !distributionId) {
        console.error('Error: SWAGGER_BUCKET_NAME and SWAGGER_DISTRIBUTION_ID must be defined in the environment config.');
        process.exit(1);
    }

    const swaggerDirPath = new URL('..', import.meta.url).pathname;
    const filesToDeploy = ['index.html', 'swagger.json'];

    for (const file of filesToDeploy) {
        const sourcePath = `${swaggerDirPath}/${file}`;
        const command = `aws s3 cp ${sourcePath} s3://${bucketName}/${swaggerFolder}/${file} --profile ${profileName}`;
        console.log(`Executing: ${command}`);
        try {
            const { stdout, stderr } = await execAsync(command);
            if (stderr) {
                console.error(`Error deploying ${file}:`, stderr);
            }
            console.log(stdout);
        } catch (error) {
            console.error(`Failed to deploy ${file}:`, error);
            process.exit(1);
        }
    }

    const invalidationCommand = `aws cloudfront create-invalidation --distribution-id ${distributionId} --paths "/*" --profile ${profileName}`;
    console.log(`Executing: ${invalidationCommand}`);
    try {
        const { stdout, stderr } = await execAsync(invalidationCommand);
        if (stderr) {
            console.error('Error creating CloudFront invalidation:', stderr);
        }
        console.log(stdout);
        console.log('Swagger deployment completed successfully.');
    } catch (error) {
        console.error('Failed to create CloudFront invalidation:', error);
        process.exit(1);
    }
};

if (import.meta.url === `file://${process.argv[1]}`) {
    (async () => {
        const environment = await getEnvironment();
        console.log('environment:', environment);
        await deploySwagger(environment);
    })();
}
