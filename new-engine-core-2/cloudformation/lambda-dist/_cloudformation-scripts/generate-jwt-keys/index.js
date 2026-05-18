import crypto from 'crypto';

import jsonwebtoken from 'jsonwebtoken';

import { SecretsManagerClient, UpdateSecretCommand } from '@aws-sdk/client-secrets-manager';
const client = new SecretsManagerClient();

import cloudformationResponse from '@middy/cloudformation-response';
import cloudformationRouterHandler from '@middy/cloudformation-router';
import middy from '@middy/core';
import inputOutputLogger from '@middy/input-output-logger';
import secretsManager from '@middy/secrets-manager';

import { cloudformationSendResponse } from '@shared-modules/f2-middlewares';

const JWT_AUTHORIZER_SECRET = process.env.JWT_AUTHORIZER_SECRET;

function generateToken(role, jwtSecret) {
    const expiresIn = '10y';

    const payload = {
        role,
        iss: 'supabase',
    };

    const token = jsonwebtoken.sign(payload, jwtSecret, {
        expiresIn,
        algorithm: 'HS256',
    });

    return token;
}

const createHandler = middy()
    .use(
        secretsManager({
            fetchData: {
                jwt: JWT_AUTHORIZER_SECRET,
            },
            awsClientOptions: {
                region: process.env.REGION,
                profile: process.env.PROFILE,
            },
            disablePrefetch: true,
            setToContext: true,
        })
    )
    .handler(async (event, context) => {
        const { jwt } = context;

        const updateCommand = new UpdateSecretCommand({
            SecretId: JWT_AUTHORIZER_SECRET,
            SecretString: JSON.stringify({
                jwtSecret: jwt.jwtSecret,
                anonKey: generateToken('anon', jwt.jwtSecret),
                serviceRoleKey: generateToken('service_role', jwt.jwtSecret),
                secretKeyBase: crypto.randomBytes(64).toString('hex'),
            }),
        });
        await client.send(updateCommand);

        return {
            Data: {
                Message: 'Success executed',
            },
        };
    });

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
                handler: createHandler,
            },
            {
                requestType: 'Update',
                handler: skipHandler,
            },
            {
                requestType: 'Delete',
                handler: skipHandler,
            },
        ])
    );
