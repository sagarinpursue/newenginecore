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
    const { email, password, userRole, fullName, phoneNumber, userAccountId } = event.body;

    const dbApiClient = createClient(DB_API_URL, apiKey, {
        global: {
            headers: {
                Authorization: 'Bearer ' + apiKey,
            },
        },
    });

    const userDbApi = new UserDbApi(DB_API_URL, apiKey, token);
    const creatorUserId = await userDbApi.getMe();
    const creatorUserRole = await userDbApi.getUserRole(creatorUserId);
    const creatorAccountId = await userDbApi.getAccountId(creatorUserId);
    ensureIsAdmin(creatorUserRole);

    if (!isSuperAdmin(creatorUserRole) && userRole !== 'user') {
        console.log('Only user can be created');
        throw new Error('Unauthorized: Administrator privileges are required.');
    }

    if (creatorAccountId !== '00000000-0000-0000-0000-000000000000' && creatorAccountId !== userAccountId) {
        console.log('Only user in same account can be created');
        throw new Error('Unauthorized: Administrator privileges are required.');
    }

    const {
        data: createUserData,
        error: createUserError,
        status: createUserStatus,
    } = await dbApiClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // TBD: should we make this field hardcoded for now or pass it as a body part?
    });

    if (createUserError) {
        const responseError = new Error();
        responseError.response = {
            data: {
                code: createUserError.code,
                message: createUserError.message,
            },
            createUserStatus,
        };
        throw responseError;
    }

    const { error: updateUserError } = await dbApiClient
        .from('user_refs')
        .update({
            full_name: fullName,
            phone: phoneNumber,
            user_role: userRole,
            user_account_id: userAccountId,
        })
        .eq('user_id', createUserData.user.id);

    if (updateUserError) {
        const responseError = new Error();
        responseError.response = {
            data: {
                code: createUserError.code,
                message: createUserError.message,
            },
            createUserStatus,
        };
        throw responseError;
    }

    return {
        data: {
            userId: createUserData.user.id,
        },
    };
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
