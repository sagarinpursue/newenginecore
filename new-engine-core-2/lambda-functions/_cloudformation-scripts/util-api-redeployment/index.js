import { APIGatewayClient, CreateDeploymentCommand, UpdateStageCommand, GetExportCommand } from '@aws-sdk/client-api-gateway';
import { CloudFrontClient, CreateInvalidationCommand } from '@aws-sdk/client-cloudfront';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

import cloudformationResponse from '@middy/cloudformation-response';
import cloudformationRouterHandler from '@middy/cloudformation-router';
import middy from '@middy/core';
import inputOutputLogger from '@middy/input-output-logger';

import { cloudformationSendResponse } from '@shared-modules/f2-middlewares';

const apiGatewayClient = new APIGatewayClient();
const s3Client = new S3Client();
const cloudFrontClient = new CloudFrontClient();

const mainHandler = async (event, context) => {
    const {
        ResourceProperties: { RestApiId, StageName, S3BucketName, S3ObjectKey, CloudFrontDistributionId, Version },
    } = event;

    console.time('createDeployment');
    const params = {
        restApiId: RestApiId,
        stageName: StageName,
        description: `Deployment for version: ${Version}`,
    };

    console.log('Creating deployment with params:', params);
    const deployment = await apiGatewayClient.send(new CreateDeploymentCommand(params));
    console.timeEnd('createDeployment');

    console.log('Updating stage to use new deployment...');
    await apiGatewayClient.send(
        new UpdateStageCommand({
            restApiId: RestApiId,
            stageName: StageName,
            patchOperations: [
                {
                    op: 'replace',
                    path: '/deploymentId',
                    value: deployment.id,
                },
            ],
        })
    );

    const responseData = {
        DeploymentId: deployment.id,
    };

    if (CloudFrontDistributionId !== 'OFF') {
        // Web UI is off
        console.log('Exporting API specification...');
        const exportResponse = await apiGatewayClient.send(
            new GetExportCommand({
                restApiId: RestApiId,
                stageName: StageName,
                exportType: 'oas30',
                accepts: 'application/json',
            })
        );

        console.log('Uploading API specification to S3...');
        await s3Client.send(
            new PutObjectCommand({
                Bucket: S3BucketName,
                Key: S3ObjectKey,
                Body: exportResponse.body,
                ContentType: 'application/json',
            })
        );

        console.log('Creating CloudFront invalidation...');
        await cloudFrontClient.send(
            new CreateInvalidationCommand({
                DistributionId: CloudFrontDistributionId,
                InvalidationBatch: {
                    CallerReference: context.awsRequestId,
                    Paths: {
                        Quantity: 1,
                        Items: ['/' + S3ObjectKey],
                    },
                },
            })
        );
    }

    return {
        PhysicalResourceId: event.LogicalResourceId,
        Data: {
            ...responseData,
            Message: 'Successfully Created',
        },
    };
};
export const handler = middy()
    .use([inputOutputLogger(), cloudformationSendResponse(), cloudformationResponse()])
    .handler(
        cloudformationRouterHandler([
            {
                requestType: 'Create',
                handler: mainHandler,
            },
            {
                requestType: 'Update',
                handler: mainHandler,
            },
            {
                requestType: 'Delete',
                handler: async (event) => {
                    const {
                        ResourceProperties: { S3BucketName, S3ObjectKey, CloudFrontDistributionId },
                    } = event;

                    if (CloudFrontDistributionId !== 'OFF') {
                        console.log('Uploading API specification to S3...');
                        await s3Client.send(
                            new DeleteObjectCommand({
                                Bucket: S3BucketName,
                                Key: S3ObjectKey,
                            })
                        );
                    }
                    return {
                        PhysicalResourceId: event.LogicalResourceId,
                        Data: {
                            Message: 'Successfully Deleted',
                        },
                    };
                },
            },
        ])
    );
