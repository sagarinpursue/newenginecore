// Native and 3rd party Node modules
import { createClient } from '@supabase/supabase-js';

import middy from '@middy/core';
import httpJsonBodyParser from '@middy/http-json-body-parser';
import inputOutputLogger from '@middy/input-output-logger';
import secretsManager from '@middy/secrets-manager';
import validator from '@middy/validator';

import Ajv from 'ajv';
import ajvErrors from 'ajv-errors';
import ajvFormats from 'ajv-formats';

import { UserDbApi } from '@shared-modules/f2-db-api';
import { httpErrorFormatter, httpResponseFormatter } from '@shared-modules/f2-middlewares';
import { ensureIsAdmin, isSuperAdmin } from '@shared-modules/f2-utils';

// Custom Node modules
import { eventSchema } from './schemas/event.js';

// Env variables
const DB_API_URL = process.env.DB_API_URL;
const JWT_AUTHORIZER_SECRET = process.env.JWT_AUTHORIZER_SECRET;

// Create AJV instance and configure it with ajv-errors and ajv-formats
const ajv = new Ajv({ coerceTypes: 'number', strictTypes: false, allowUnionTypes: true, allErrors: true });
ajvFormats(ajv);
ajvErrors(ajv);

export const handler = middy(async (event, context) => {
    const token = event.headers.Authorization;
    const apiKey = context.jwtAuth.serviceRoleKey;
    const deletedUserId = event.queryStringParameters.userId;

    const dbApiClient = createClient(DB_API_URL, apiKey, {
        global: {
            headers: {
                Authorization: 'Bearer ' + apiKey,
            },
        },
    });

    const userDbApi = new UserDbApi(DB_API_URL, context.jwtAuth.serviceRoleKey, token);

    const deleterUserId = await userDbApi.getMe();
    const deleterUserRole = await userDbApi.getUserRole(deleterUserId);
    ensureIsAdmin(deleterUserRole);

    if (deleterUserId === deletedUserId) {
        console.log('User cannot remove himself');
        throw new Error('Unauthorized: Administrator privileges are required.');
    }

    const deletedUserRole = await userDbApi.getUserRole(deletedUserId);

    if (!isSuperAdmin(deleterUserRole) && deletedUserRole !== 'user') {
        console.log('Only user can be removed');
        throw new Error('Unauthorized: Administrator privileges are required.');
    }

    // TODO [IM] Using of @supabase/supabase-js should be moved to @shared-modules/f2-db-api
    const { error: deleteUserError, status: deleteUserStatus } = await dbApiClient.auth.admin.deleteUser(deletedUserId);
    if (deleteUserError) {
        const responseError = new Error();
        responseError.response = {
            data: {
                code: deleteUserError.code,
                message: deleteUserError.message,
            },
            deleteUserStatus,
        };
        throw responseError;
    }

    return { data: 'User deleted successfully.' };
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
    validator({ eventSchema: ajv.compile(eventSchema) }),
    httpResponseFormatter(),
    httpErrorFormatter(),
]);
