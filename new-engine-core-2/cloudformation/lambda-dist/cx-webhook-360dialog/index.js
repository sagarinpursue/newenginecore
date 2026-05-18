import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

import middy from '@middy/core';
import httpJsonBodyParser from '@middy/http-json-body-parser';
import inputOutputLogger from '@middy/input-output-logger';
import secretsManager from '@middy/secrets-manager';
import validator from '@middy/validator';

import Ajv from 'ajv';
import ajvErrors from 'ajv-errors';
import ajvFormats from 'ajv-formats';

import { ChatbotSessionDbApi, Cx360DialogStatusDbApi, ChatMessageDbApi, RpcDbApi } from '@shared-modules/f2-db-api';
import { httpResponseFormatter } from '@shared-modules/f2-middlewares';

import { eventSchema } from './schemas/event.js';
import { invokeLambda } from './services/lambda-service.js';

const ENV = process.env.ENV;
const AWS_REGION = process.env.AWS_REGION;
const DB_API_URL = process.env.DB_API_URL;
const JWT_AUTHORIZER_SECRET = process.env.JWT_AUTHORIZER_SECRET;
const REQUEST_PROCESSING_ARN = process.env.REQUEST_PROCESSING_ARN;

const secretsManagerClient = new SecretsManagerClient({ region: AWS_REGION });

const SESSION_TIMEOUT = 10;
const GOOD_REACTIONS = ['👍', '✅', '❤️'];
const BAD_REACTIONS = ['👎', '❌', '💩'];

const ajv = new Ajv({ allErrors: true });
ajvFormats(ajv);
ajvErrors(ajv);

export const handler = middy(async (event, context) => {
    const { entry } = event.body;

    const rpcDb = new RpcDbApi(DB_API_URL, context.jwtAuth.serviceRoleKey);
    const chatbotSessionDb = new ChatbotSessionDbApi(
        DB_API_URL,
        context.jwtAuth.serviceRoleKey,
        `Bearer ${context.jwtAuth.serviceRoleKey}`
    );
    const cx360DialogStatusDb = new Cx360DialogStatusDbApi(
        DB_API_URL,
        context.jwtAuth.serviceRoleKey,
        `Bearer ${context.jwtAuth.serviceRoleKey}`
    );
    const chatMessageDb = new ChatMessageDbApi(
        DB_API_URL,
        context.jwtAuth.serviceRoleKey,
        `Bearer ${context.jwtAuth.serviceRoleKey}`
    );

    if (entry.length > 1) {
        console.warn('>>>>> Many Entries');
    }

    // [IM] In most part of cases we should have 1 entry and 1 change in it,
    // but we should be ready for many items in these arrays

    for (const item of entry) {
        const waBusinessId = item.id;
        const config = await rpcDb.getVendorConfig(waBusinessId);
        if (!config) {
            console.error('>>>>> Config not found');
            continue;
        }

        console.log('>>>>> Config');
        console.log(config);

        if (item.changes.length > 1) {
            console.warn('>>>>> Many Changes');
        }

        await validateAuthHeader(event.headers, config);

        for (const change of item.changes) {
            const waEvent = change.value;

            console.log('Metadata:', JSON.stringify(waEvent.metadata));
            console.log('Contacts:', JSON.stringify(waEvent.contacts));

            if (waEvent.statuses) {
                if (waEvent.statuses.length > 1) {
                    console.warn('>>>>> Many Statuses');
                }

                for (const status of waEvent.statuses) {
                    console.log('Status:', JSON.stringify(status));

                    await saveReceivedStatus(config, status, cx360DialogStatusDb);
                }
            }

            if (waEvent.messages) {
                if (waEvent.messages.length > 1) {
                    console.warn('>>>>> Many Messages');
                }

                // TODO [IM] combine messages if several relates to the same client?
                for (const message of waEvent.messages) {
                    // TODO [IM] We should not log exact message of the client
                    console.log('Message:', JSON.stringify(message));

                    switch (message.type) {
                        case 'reaction':
                            await handleWhatAppReaction(config, message, chatMessageDb);
                            break;
                        case 'text':
                            await saveMessageStatus(config, message, waEvent.contacts, cx360DialogStatusDb);
                            await handleWhatAppMessage(config, message, chatbotSessionDb);
                            break;
                        default:
                            console.error(`Message type does not supported: ${message.type}`);
                    }
                }
            }
        }
    }

    return { data: '' };
}).use([
    // TODO [IM] Temporary
    // inputOutputLogger({ omitPaths: ['event.body'], mask: '***omitted***' }),
    inputOutputLogger(),
    httpJsonBodyParser({ disableContentTypeError: true }),
    secretsManager({
        fetchData: {
            jwtAuth: JWT_AUTHORIZER_SECRET,
        },
        disablePrefetch: true,
        setToContext: true,
    }),
    validator({ eventSchema: ajv.compile(eventSchema) }),
    httpResponseFormatter(),
    {
        onError: async (request) => {
            const { error } = request;

            console.error('Webhook Error:', error);

            request.response = {
                statusCode: 200,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json',
                },
            };
        },
    },
]);

const validateAuthHeader = async (headers, config) => {
    const params = {
        SecretId: `f2-${ENV}/cx/channel-vendor-secret/${config.channelId}`,
    };

    const { SecretString } = await secretsManagerClient.send(new GetSecretValueCommand(params));
    const vendorSecret = JSON.parse(SecretString);

    if (!vendorSecret.auth) {
        console.log('>>>>> No Checks');
        return;
    }

    if (headers.Authorization !== `Basic ${btoa(vendorSecret.auth)}`) {
        throw new Error('Unauthorized');
    } else {
        console.log('>>>>> Authorized');
    }
};

const saveReceivedStatus = async (config, status, cx360DialogStatusDb) => {
    const payload = {
        channelId: config.channelId,
        accountId: config.accountId,
        messageId: status.id,
        status: status.status,
        timestamp: status.timestamp,
        // no type
        recipientId: status.recipient_id,
        recipientUserId: status.recipient_user_id,
    };

    let _details = {};
    for (const [key, value] of Object.entries(status)) {
        if (typeof value === 'object') {
            _details[key] = value;
        }
    }
    if (Object.keys(_details).length > 0) {
        payload.details = _details;
    }

    await cx360DialogStatusDb.addStatus(payload);
};

const saveMessageStatus = async (config, message, contacts, cx360DialogStatusDb) => {
    let _profile_name = null;
    for (const contact of contacts) {
        if (contact.wa_id === message.from || contact.user_id === message.from_user_id) {
            _profile_name = contact.profile?.name || null;
        }
    }

    const payload = {
        channelId: config.channelId,
        accountId: config.accountId,
        messageId: message.id,
        status: 'received',
        timestamp: message.timestamp,
        type: message.type || 'undefined', // TODO [IM] location and contacts possible not have 'type' field
        recipientName: _profile_name,
        recipientId: message.from,
        recipientUserId: message.from_user_id,
        // no details
    };

    await cx360DialogStatusDb.addStatus(payload);
};

const handleWhatAppReaction = async (config, message, chatMessageDb) => {
    let chatMessage = await chatMessageDb.getMessageByVendorMessageId(message.reaction?.message_id);
    if (!chatMessage) {
        console.error('>>>>> Message does not exist or belongs to client');
        return;
    }

    if (!message.reaction?.emoji) {
        console.log('>>>>> Clean reaction');
        await chatMessageDb.removeRating(chatMessage.chat_message_id);
        await chatMessageDb.removeFeedback(chatMessage.chat_message_id);
        return;
    }

    let _ratingType;
    if (GOOD_REACTIONS.includes(message.reaction?.emoji)) {
        console.log('Good Reaction');
        _ratingType = 'upvote';
    } else if (BAD_REACTIONS.includes(message.reaction?.emoji)) {
        console.log('Bad Reaction');
        _ratingType = 'downvote';
    } else {
        console.error('>>>>> Reaction does not supported');
        return;
    }

    await chatMessageDb.saveRating(chatMessage.chat_message_id, _ratingType);
    if (_ratingType === 'downvote') {
        console.log('>>>>> Save Feedback');
        await chatMessageDb.saveFeedback(chatMessage.chat_message_id, 'Other', message.reaction?.emoji);
    } else if (_ratingType === 'upvote') {
        console.log('>>>>> Remove Feedback');
        await chatMessageDb.removeFeedback(chatMessage.chat_message_id);
    }
};

const handleWhatAppMessage = async (config, message, chatbotSessionDb) => {
    // const _input_text = parseWhatsappMessage(message);

    const _clientId = message.from || message.from_user_id; // TODO [IM] in May completely move to from_user_id?

    // TODO [IM] get timeout from agent while session creation instead of hardcoded SESSION_TIMEOUT?
    let session = await chatbotSessionDb.getActiveSessionByVendorClientId(config.channelId, _clientId, SESSION_TIMEOUT);
    if (!session) {
        console.log('>>>>> Session not found, creating new');
        session = await chatbotSessionDb.createSession({
            chatId: config.chatId,
            channelId: config.channelId,
            accountId: config.accountId,
            vendorType: '360dialog',
            vendorClientId: _clientId,
        });
    }

    const payload = {
        sessionId: session.session_id,
        channelId: config.channelId,
        // input: _input_text,
        input: message.text?.body,
        config,
        session,
        metadata: {
            vendorMessageId: message.id,
        },
    };

    console.log('>>>>> Payload');
    console.log(payload);

    // TODO [IM] move invokeLambda to @shared_modules and redesign into client?
    await invokeLambda(REQUEST_PROCESSING_ARN, 'Event', payload);
};

// const parseWhatsappMessage = (message) => {
//     // + voice + reaction + image/video/audio/document/sticker + order/system/identity/contacts/location?
//     if (message.hasOwnProperty('text')) {
//         return convertArabicNumbers2English(message.text.body);
//     }
//     if (message.hasOwnProperty('button')) {
//         return convertArabicNumbers2English(message.button.text);
//     }
//     if (message.interactive?.button_reply) {
//         return message.interactive.button_reply.id;
//     }
//     if (message.interactive?.list_reply) {
//         return message.interactive.list_reply.id;
//     }
//     if (message.interactive?.nfm_reply) {
//         return convertJsonToText(message.interactive.nfm_reply.response_json);
//     }
//     return '';
// };

// const convertArabicNumbers2English = (string) => {
//     return string.replace(/[\u0660-\u0669]/g, (c) => {
//         return c.charCodeAt(0) - 0x0660;
//     });
// };

// const convertJsonToText = (stringified_json) => {
//     try {
//         const parsed_json = JSON.parse(stringified_json);
//         let _message = '';
//
//         for (let prop in parsed_json) {
//             _message += `${prop}: ${parsed_json[prop]}\n`;
//         }
//
//         return _message.slice(0, -1);
//     } catch (err) {
//         return stringified_json;
//     }
// };
