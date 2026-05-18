import apiGateway from './api-gateway/index.js';
// import ec2 from './ec2/index.js';
import lambdaFunctions from './lambda-functions/index.js';
// import openSearch from './open-search/index.js';
import policy from './policy/index.js';
import role from './role/index.js';
// import s3 from './s3/index.js';
import schedulers from './scheduler/index.js';
import { getEnvironment } from './utils.js';

(async function () {
    console.log('Start');
    const environment = await getEnvironment();
    console.log('environment: ', environment);

    // const isInitialDeploy = process.argv.some((arg) => arg === 'initial-deploy');
    // console.log('isInitialDeploy: ', isInitialDeploy);

    // Deploy policy
    await policy(environment);

    // Deploy role
    await role(environment);

    // Deploy S3
    // await s3(environment); // creation via cft

    // TODO: Deploy VPC and update config

    // TODO: Deploy RDS and update config

    // TODO: Copy DB API zip to S3

    // Deploy EC2
    // await ec2(environment); // creation via cft

    // TODO: update DB API URL in config

    // Deploy Open Search
    // await openSearch(environment); // no need to create it

    // Deploy API Gateway
    await apiGateway(environment);

    // Deploy Lambda functions
    await lambdaFunctions(environment);

    // Deploy Schedulers functions
    await schedulers(environment);

    // TODO: deploy UI (portal and widget)

    // TODO: Deploy Cloud Front (portal and widget)
})()
    .then(() => {
        console.log('Succeeded');
    })
    .catch((err) => {
        console.log('Failed:', err);
    });
