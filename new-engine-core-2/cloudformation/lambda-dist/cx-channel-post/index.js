// Native and 3rd party Node modules
import middy from '@middy/core';
import httpJsonBodyParser from '@middy/http-json-body-parser';
import inputOutputLogger from '@middy/input-output-logger';
import secretsManager from '@middy/secrets-manager';
import validator from '@middy/validator';

import Ajv from 'ajv';
import ajvErrors from 'ajv-errors';
import ajvFormats from 'ajv-formats';

import { CxChannelDbApi } from '@shared-modules/f2-db-api';
import { UserDbApi } from '@shared-modules/f2-db-api';
import { httpErrorFormatter, httpResponseFormatter } from '@shared-modules/f2-middlewares';

// Custom Node modules
import { eventSchema } from './schemas/event.js';
import CustomChannelService from './services/custom-channel-service.js';
import DialogChannelService from './services/dialog-channel-service.js';
import WebChannelService from './services/web-channel-service.js';

// Custom env vars
const DB_API_URL = process.env.DB_API_URL;
const JWT_AUTHORIZER_SECRET = process.env.JWT_AUTHORIZER_SECRET;

// Create AJV instance and configure it with ajv-errors and ajv-formats
const ajv = new Ajv({ coerceTypes: 'number', strictTypes: false, allowUnionTypes: true, allErrors: true });
ajvFormats(ajv);
ajvErrors(ajv);

export const handler = middy(async (event, context) => {
    const token = event.headers.Authorization;

    const cxChannelDbApi = new CxChannelDbApi(DB_API_URL, context.jwtAuth.anonKey, token);
    const userDbApi = new UserDbApi(DB_API_URL, context.jwtAuth.anonKey, token);

    const userId = await userDbApi.getMe();
    console.log('userId:', userId);
    const accountId = await userDbApi.getAccountId(userId);
    console.log('accountId:', accountId);

    if (event.body.channelId) {
        // editing
        const channel = await cxChannelDbApi.get(event.body.channelId);

        let updateParams = {
            chatId: event.body.chatId,
        };

        if (channel.channel === '360dialog') {
            if (event.body.vendorLabel) {
                updateParams.vendorLabel = event.body.vendorLabel;
            }
            if (event.body.vendorId) {
                updateParams.vendorId = event.body.vendorId;
            }
        }

        await cxChannelDbApi.update(event.body.channelId, updateParams);

        if (channel.channel === '360dialog') {
            if (
                (event.body.vendorSecret && event.body.vendorSecret !== '*****') ||
                (event.body.vendorAuth && event.body.vendorAuth !== '*****')
            ) {
                const dialogChannelService = new DialogChannelService(cxChannelDbApi);
                await dialogChannelService.updateSecret(event.body.channelId, event.body.vendorSecret, event.body.vendorAuth);
            }
        }

        return { data: '' };
    } else {
        // creating
        if (event.body.channel === 'web') {
            const webChannelService = new WebChannelService(cxChannelDbApi);
            await webChannelService.create(event.body.name, event.body.chatId, accountId);
        } else if (event.body.channel === 'custom') {
            const customChannelService = new CustomChannelService(cxChannelDbApi);
            await customChannelService.create(event.body.name, event.body.chatId, accountId);
        } else if (event.body.channel === '360dialog') {
            const dialogChannelService = new DialogChannelService(cxChannelDbApi);
            await dialogChannelService.create(
                event.body.name,
                event.body.chatId,
                accountId,
                event.body.vendorLabel,
                event.body.vendorId,
                event.body.vendorSecret,
                event.body.vendorAuth
            );
        }

        return { data: '' };
    }
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
