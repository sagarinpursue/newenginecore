import { handler } from './index.js';

handler({
    RequestType: 'Delete',
    ServiceToken: 'ServiceToken',
    ServiceTimeout: '70',
    ResponseURL: '',
    StackId: 'StackId',
    RequestId: 'RequestId',
    LogicalResourceId: 'LogicalResourceId',
    PhysicalResourceId: 'PhysicalResourceId',
    ResourceType: 'ResourceType',
    ResourceProperties: {
        ServiceToken: 'ServiceToken',
        BucketName: 'f2-bucket-artifacts-us-west-2-dev',
        // Directory: 'f2-platform/1.0.11-2025-11-17-19-21-51',
    },
})
    .then((response) => {
        console.log('response :>> ', response);
    })
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });
