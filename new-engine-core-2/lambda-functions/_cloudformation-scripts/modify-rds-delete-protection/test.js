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
        ClusterIdentifier: 'supabase-cluster',
    },
})
    .then((response) => {
        console.log('response :>> ', response);
    })
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });
