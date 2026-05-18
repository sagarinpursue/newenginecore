import { RDSClient, ModifyDBClusterCommand } from '@aws-sdk/client-rds';

import cloudformationResponse from '@middy/cloudformation-response';
import cloudformationRouterHandler from '@middy/cloudformation-router';
import middy from '@middy/core';
import inputOutputLogger from '@middy/input-output-logger';

import { cloudformationSendResponse } from '@shared-modules/f2-middlewares';

const client = new RDSClient({ region: process.env.AWS_REGION });

const skipHandler = () => {
    return {
        Data: {
            Message: 'Skipped executed',
        },
    };
};

export const handler = middy()
    .use([inputOutputLogger(), cloudformationSendResponse(), cloudformationResponse()])
    .handler(
        cloudformationRouterHandler([
            {
                requestType: 'Create',
                handler: async (event) => {
                    const clusterId = event.ResourceProperties.ClusterIdentifier;
                    const command = new ModifyDBClusterCommand({
                        DBClusterIdentifier: clusterId,
                        DeletionProtection: true,
                    });
                    await client.send(command);
                    return {
                        Data: {
                            Message: 'Success enabled deletion protection',
                        },
                    };
                },
            },
            {
                requestType: 'Update',
                handler: skipHandler,
            },
            {
                requestType: 'Delete',
                handler: async (event) => {
                    const clusterId = event.ResourceProperties.ClusterIdentifier;
                    const command = new ModifyDBClusterCommand({
                        DBClusterIdentifier: clusterId,
                        DeletionProtection: false,
                    });
                    await client.send(command);
                    return {
                        Data: {
                            Message: 'Success disabled deletion protection',
                        },
                    };
                },
            },
        ])
    );
