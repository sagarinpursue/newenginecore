import middy from '@middy/core';
import secretsManager from '@middy/secrets-manager';

import { ChatbotSessionDbApi } from '@shared-modules/f2-db-api';

import { connect } from './providers/connect.js';
import { liveChatConnect } from './providers/live-chat.js';
import { Responses } from './utils/responses.js';
import { extractEventData, validateEvent } from './utils/validation.js';

const DB_API_URL = process.env.DB_API_URL;
const JWT_AUTHORIZER_SECRET = process.env.JWT_AUTHORIZER_SECRET;

export const handler = middy(async (event, context) => {
    console.log('event:', event);
    try {
        const validationFailResponse = validateEvent(event);

        if (validationFailResponse) {
            return validationFailResponse;
        }

        const { user, config } = extractEventData(event);
        console.log('user:', user);
        console.log('config:', config);

        const chatbotSessionDb = new ChatbotSessionDbApi(
            DB_API_URL,
            context.jwtAuth.serviceRoleKey,
            `Bearer ${context.jwtAuth.serviceRoleKey}`
        );

        const connectOptions = {
            user: user,
            config: config,
            keys: {
                dbApiKey: context.jwtAuth.anonKey,
                dbServiceKey: context.jwtAuth.serviceRoleKey,
            },
        };

        // TODO [MK] I suggest to create an object for using it in switch cases, for example:
        // const Providers = {
        //     LiveChat: 'LiveChat',
        // };
        // case Providers.LiveChat:
        switch (config.chatProvider) {
            // TODO [IM] are we sure string should be used here?
            case 'LiveChat':
                await liveChatConnect(connectOptions);
                break;
            default:
                await connect(connectOptions);
        }

        await chatbotSessionDb.markSessionAsEscalatedToLiveAgent(config.sessionId);

        return Responses.success;
    } catch (e) {
        console.error(e);
        return Responses.serverError(e);
    }
}).use([
    secretsManager({
        fetchData: {
            jwtAuth: JWT_AUTHORIZER_SECRET,
        },
        disablePrefetch: true,
        setToContext: true,
    }),
]);
