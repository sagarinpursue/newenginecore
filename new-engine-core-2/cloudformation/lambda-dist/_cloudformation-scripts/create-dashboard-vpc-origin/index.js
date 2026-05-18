import {
    CloudFrontClient,
    CreateVpcOriginCommand,
    DeleteVpcOriginCommand,
    GetVpcOriginCommand,
} from '@aws-sdk/client-cloudfront';
import { EC2Client, DescribeSecurityGroupsCommand } from '@aws-sdk/client-ec2';
const cloudFrontClient = new CloudFrontClient({
    region: process.env.AWS_REGION,
});
const ec2Client = new EC2Client({
    region: process.env.AWS_REGION,
});

import cloudformationResponse from '@middy/cloudformation-response';
import cloudformationRouterHandler from '@middy/cloudformation-router';
import middy from '@middy/core';
import inputOutputLogger from '@middy/input-output-logger';

import { cloudformationSendResponse } from '@shared-modules/f2-middlewares';

const maxAttempts = 4; // Maximum number of attempts to check the status
const interval = 180000; // 3 minutes

const waitToDeployedVpcOrigin = async (vpcOriginId) => {
    let attempts = 0;
    while (attempts < maxAttempts) {
        attempts++;
        console.log(`Attempt #${attempts}: Checking VPC origin status...`);

        try {
            const params = { Id: vpcOriginId };
            const { VpcOrigin } = await cloudFrontClient.send(new GetVpcOriginCommand(params));

            if (VpcOrigin?.Status === 'Deployed') {
                console.log(`Success! VPC Origin ${vpcOriginId} is deployed.`);
                return;
            }

            console.log(`Current status: ${VpcOrigin?.Status}. Waiting ${interval / 1000} seconds...`);
        } catch (error) {
            console.error('Error getting VPC origin status:', error);
            throw error;
        }

        await new Promise((resolve) => setTimeout(resolve, interval));
    }

    throw new Error(`Max attempts exceeded (${maxAttempts}). VPC Origin ${vpcOriginId} did not transition to "Deployed" state.`);
};

export const handler = middy()
    .use([inputOutputLogger(), cloudformationSendResponse(), cloudformationResponse()])
    .handler(
        cloudformationRouterHandler([
            {
                requestType: 'Create',
                handler: async (event) => {
                    const { OriginName, OriginArn } = event.ResourceProperties;

                    const command = new CreateVpcOriginCommand({
                        VpcOriginEndpointConfig: {
                            Arn: OriginArn,
                            Name: OriginName,
                            OriginProtocolPolicy: 'http-only',
                            HTTPPort: 80,
                            HTTPSPort: 443,
                        },
                    });
                    const response = await cloudFrontClient.send(command).catch((error) => {
                        console.error('Error creating VPC Origin:', error);
                        throw error;
                    });
                    console.log('Created VPC Origin:', response);

                    const vpcOriginId = response.VpcOrigin?.Id;

                    await waitToDeployedVpcOrigin(vpcOriginId).catch(console.error);

                    const {
                        SecurityGroups: [securityGroup],
                    } = await ec2Client.send(
                        new DescribeSecurityGroupsCommand({
                            Filters: [{ Name: 'tag-key', Values: ['aws.cloudfront.vpcorigin'] }],
                        })
                    );

                    return {
                        PhysicalResourceId: vpcOriginId,
                        Data: {
                            Message: 'Successfully Created',
                            VpcOriginId: vpcOriginId,
                            VpcOriginSecurityGroupId: securityGroup?.GroupId,
                        },
                    };
                },
            },
            {
                requestType: 'Update',
                handler: async () => {
                    return {
                        Data: {
                            Message: 'Skipped execution',
                        },
                    };
                },
            },
            {
                requestType: 'Delete',
                handler: async (event) => {
                    let message = 'Successfully Deleted';
                    try {
                        const vpcOrigin = await cloudFrontClient.send(new GetVpcOriginCommand({ Id: event.PhysicalResourceId }));
                        await cloudFrontClient.send(
                            new DeleteVpcOriginCommand({
                                Id: event.PhysicalResourceId,
                                IfMatch: vpcOrigin.ETag,
                            })
                        );
                        console.log('Deleted VPC Origin');
                    } catch (error) {
                        message = 'Error deleting VPC Origin: ' + error.message;
                    }
                    return {
                        PhysicalResourceId: event.LogicalResourceId,
                        Data: {
                            Message: message,
                        },
                    };
                },
            },
        ])
    );
