import cloudformationResponse from '@middy/cloudformation-response';
import cloudformationRouterHandler from '@middy/cloudformation-router';
import middy from '@middy/core';
import inputOutputLogger from '@middy/input-output-logger';

import { cloudformationSendResponse } from '@shared-modules/f2-middlewares';

import { uploadDirectory, removeDirectory } from './utils/manager-on-s3.js';

export const handler = middy()
    .use([inputOutputLogger(), cloudformationSendResponse(), cloudformationResponse()])
    .handler(
        cloudformationRouterHandler([
            {
                requestType: 'Create',
                handler: async () => {
                    await uploadDirectory('ec2-config');
                    return {
                        Data: {
                            Message: 'Success executed',
                        },
                    };
                },
            },
            {
                requestType: 'Update',
                handler: async () => {
                    await uploadDirectory('ec2-config');
                    return {
                        Data: {
                            Message: 'Success executed',
                        },
                    };
                },
            },
            {
                requestType: 'Delete',
                handler: async () => {
                    await removeDirectory('ec2-config');
                    return {
                        Data: {
                            Message: 'Success Removed',
                        },
                    };
                },
            },
        ])
    );
