import { readFile } from 'fs/promises';
import { resolve } from 'path';

import { createClient } from '@supabase/supabase-js';

import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

import middy from '@middy/core';
import httpJsonBodyParser from '@middy/http-json-body-parser';
import inputOutputLogger from '@middy/input-output-logger';
import secretsManager from '@middy/secrets-manager';

import { httpErrorFormatter, httpResponseFormatter } from '@shared-modules/f2-middlewares';

const REGION = process.env.AWS_REGION;
const DB_API_URL = process.env.DB_API_URL;
const PORTAL_DOMAIN = process.env.PORTAL_DOMAIN;
const JWT_AUTHORIZER_SECRET = process.env.JWT_AUTHORIZER_SECRET;

const sesClient = new SESClient({ region: REGION });

export const handler = middy(async (event, context) => {
    if (PORTAL_DOMAIN === 'none') {
        console.error('Portal domain not found');
        return { data: '' };
    }

    const apiKey = context.jwtAuth.serviceRoleKey;
    const { email } = event.body;

    const dbApiClient = createClient(DB_API_URL, apiKey, {
        global: {
            headers: {
                Authorization: 'Bearer ' + apiKey,
            },
        },
    });

    try {
        const { data, error } = await dbApiClient.auth.admin.generateLink({
            type: 'recovery',
            email,
        });

        if (error) {
            console.error('Failed to generate link:', error);
            return { data: '' };
        }

        const filePath = resolve(process.cwd(), 'index.html');
        let fileContent = await readFile(filePath, 'utf8');

        const forgotLink = `https://${PORTAL_DOMAIN}/reset-password#access_token=${data.properties.hashed_token}`;

        fileContent = fileContent.replace(/{ResetLink}/, forgotLink);

        const params = {
            Source: 'imorozov@confidenceway.com',
            Destination: {
                ToAddresses: [email],
            },
            Message: {
                Subject: {
                    Data: 'F2 Platform. Restore password.',
                    Charset: 'UTF-8',
                },
                Body: {
                    Html: {
                        Data: fileContent,
                        Charset: 'UTF-8',
                    },
                },
            },
        };

        const command = new SendEmailCommand(params);

        await sesClient.send(command);
    } catch (error) {
        console.error('Failed to send email:', error);
    }

    return { data: '' };
}).use([
    inputOutputLogger(),
    httpJsonBodyParser({
        disableContentTypeError: true,
    }),
    secretsManager({
        fetchData: {
            jwtAuth: JWT_AUTHORIZER_SECRET,
        },
        disablePrefetch: true,
        setToContext: true,
    }),
    httpResponseFormatter(),
    httpErrorFormatter(),
]);
