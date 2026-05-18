// Native and 3rd party Node modules
import cloudformationResponse from '@middy/cloudformation-response';
import cloudformationRouterHandler from '@middy/cloudformation-router';
import middy from '@middy/core';
import inputOutputLogger from '@middy/input-output-logger';
import secretsManager from '@middy/secrets-manager';

import { UserDbApi } from '@shared-modules/f2-db-api';
import { cloudformationSendResponse } from '@shared-modules/f2-middlewares';

// Env variables
const JWT_AUTHORIZER_SECRET = process.env.JWT_AUTHORIZER_SECRET;
const DB_API_URL = process.env.DB_API_URL;

const createHandler = async (event, context) => {
    const { jwtDb } = context;

    const { AdminEmail: email, AdminPassword: password } = event.ResourceProperties;

    const userDbApi = new UserDbApi(DB_API_URL, jwtDb.serviceRoleKey);

    const newUserId = await userDbApi.createUser({
        email,
        password,
        accountId: '00000000-0000-0000-0000-000000000000',
        role: 'super_admin',
    });

    return {
        PhysicalResourceId: newUserId,
        Data: {
            Message: 'User created successfully',
        },
    };
};

export const handler = middy()
    .use([inputOutputLogger(), cloudformationSendResponse(), cloudformationResponse()])
    .handler(
        cloudformationRouterHandler([
            {
                requestType: 'Create',
                handler: middy()
                    .use([
                        secretsManager({
                            fetchData: {
                                jwtDb: JWT_AUTHORIZER_SECRET,
                            },
                            disablePrefetch: true,
                            setToContext: true,
                        }),
                    ])
                    .handler(createHandler),
            },
            {
                requestType: 'Update',
                handler: () => {
                    throw new Error('Update operation is not supported for admin user creation.');
                },
            },
            {
                requestType: 'Delete',
                handler: () => {
                    return {
                        Data: {
                            Message: 'Skipped executed',
                        },
                    };
                },
            },
        ])
    );
