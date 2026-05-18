import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

import middy from '@middy/core';
import httpJsonBodyParser from '@middy/http-json-body-parser';
import inputOutputLogger from '@middy/input-output-logger';
import secretsManager from '@middy/secrets-manager';

import { httpErrorFormatter, httpResponseFormatter } from '@shared-modules/f2-middlewares';

const DB_API_URL = process.env.DB_API_URL;
const JWT_AUTHORIZER_SECRET = process.env.JWT_AUTHORIZER_SECRET;

export const handler = middy(async (event, context) => {
    const anonKey = context.jwtAuth.anonKey;
    const apiKey = context.jwtAuth.serviceRoleKey;
    const { password, token } = event.body;

    const dbApiClient = createClient(DB_API_URL, apiKey, {
        global: {
            headers: {
                Authorization: 'Bearer ' + apiKey,
            },
        },
    });

    try {
        const { data, error } = await dbApiClient.auth.verifyOtp({
            token_hash: token,
            type: 'recovery',
        });

        if (error) {
            console.error('Failed to verify link:', error);
            return { data: '' };
        }

        await axios.put(
            `${DB_API_URL}/auth/v1/user`,
            { password },
            {
                headers: {
                    Authorization: `Bearer ${data.session.access_token}`,
                    apikey: anonKey,
                },
            }
        );
    } catch (error) {
        console.error('Failed to update password:', error);
    }

    return { data: '' };
}).use([
    inputOutputLogger({ omitPaths: ['event.body'], mask: '***omitted***' }),
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
