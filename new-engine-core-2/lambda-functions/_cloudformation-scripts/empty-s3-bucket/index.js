import cloudformationResponse from '@middy/cloudformation-response';
import cloudformationRouterHandler from '@middy/cloudformation-router';
import middy from '@middy/core';
import inputOutputLogger from '@middy/input-output-logger';

import { AwsS3Client } from '@shared-modules/f2-clients';
import { cloudformationSendResponse } from '@shared-modules/f2-middlewares';

export const handler = middy()
    .use([inputOutputLogger(), cloudformationSendResponse(), cloudformationResponse()])
    .handler(
        cloudformationRouterHandler([
            {
                requestType: 'Create',
                handler: async () => {
                    return {
                        Data: {
                            Message: 'Skipped executed',
                        },
                    };
                },
            },
            {
                requestType: 'Update',
                handler: async () => {
                    return {
                        Data: {
                            Message: 'Skipped executed',
                        },
                    };
                },
            },
            {
                requestType: 'Delete',
                handler: async (event) => {
                    const { BucketName, Directory = '' } = event.ResourceProperties;
                    const s3Client = new AwsS3Client();
                    await s3Client.emptyBucketDirectory(BucketName, Directory);

                    return {
                        Data: {
                            Message: 'Success Removed',
                        },
                    };
                },
            },
        ])
    );
