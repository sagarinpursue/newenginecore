import { randomUUID } from 'crypto';

import axios from 'axios';

import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi';
import { BedrockAgentRuntimeClient, InvokeAgentCommand } from '@aws-sdk/client-bedrock-agent-runtime';
import { CloudWatchLogsClient, CreateLogStreamCommand, PutLogEventsCommand } from '@aws-sdk/client-cloudwatch-logs';
// import { ComprehendClient, DetectDominantLanguageCommand } from '@aws-sdk/client-comprehend';
import { ComprehendClient, DetectPiiEntitiesCommand } from '@aws-sdk/client-comprehend';
import { ConnectParticipantClient, SendMessageCommand } from '@aws-sdk/client-connectparticipant';
import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';
import { LexRuntimeV2Client, RecognizeTextCommand } from '@aws-sdk/client-lex-runtime-v2';
import { SQSClient, SendMessageCommand as SendMessageToQueueCommand } from '@aws-sdk/client-sqs';

import middy from '@middy/core';
import secretsManager from '@middy/secrets-manager';

import {
    ChatbotSessionDbApi,
    LiveChatSessionDbApi,
    ChatMessageDbApi,
    CxWebSocketConnectionDbApi,
    Cx360DialogStatusDbApi,
} from '@shared-modules/f2-db-api';
import { publishReadTo360Dialog, publishTo360Dialog, publishToQueueForPolling } from '@shared-modules/f2-utils';

// import { getLocaleId } from './utils/locales.js';
import { Responses } from './utils/responses.js';
// import validateRequestEvent from './utils/validation.js';

const ENV = process.env.ENV;
const APP_NAME = process.env.APP_NAME;
const AWS_REGION = process.env.AWS_REGION;
const DB_API_URL = process.env.DB_API_URL;
const JWT_AUTHORIZER_SECRET = process.env.JWT_AUTHORIZER_SECRET;
const TRACING_LOG_GROUP = process.env.TRACING_LOG_GROUP;
const LLM_DATA_SOURCES_FOLDER = process.env.LLM_DATA_SOURCES_FOLDER;
const RESPONSE_ANALYSIS_QUEUE = process.env.RESPONSE_ANALYSIS_QUEUE;
const WEBSOCKET_URL = process.env.WEBSOCKET_URL;

const lexRuntimeV2Client = new LexRuntimeV2Client({ region: AWS_REGION });
const comprehendClient = new ComprehendClient({ region: AWS_REGION });
const bedrockAgentRuntimeClient = new BedrockAgentRuntimeClient({ region: AWS_REGION });
const lambdaClient = new LambdaClient({ region: AWS_REGION });
const participantClient = new ConnectParticipantClient({ region: AWS_REGION });
const cloudWatchLogsClient = new CloudWatchLogsClient({ region: AWS_REGION });
const sqsClient = new SQSClient({ region: AWS_REGION });
const apiGwClient = new ApiGatewayManagementApiClient({ region: AWS_REGION, endpoint: `https://${WEBSOCKET_URL}` });

// TODO [IM] This parameters needs to do moved to Parameter Store (CEF-I238)
const MASKING_DATA_ENABLED = true;
const PII_SCORE_THRESHOLD = 0.8;
// [IM] Name, Phone and Email excluded to allow to connect with Live Agent
const EXCLUDED_TYPES = ['NAME', 'EMAIL', 'PHONE'];

export const handler = middy(async (event, context) => {
    console.log('Session ID:', event.sessionId);
    console.log('Channel ID:', event.channelId);
    console.log('Config:', event.config);

    const chatbotSessionDb = new ChatbotSessionDbApi(
        DB_API_URL,
        context.jwtAuth.serviceRoleKey,
        `Bearer ${context.jwtAuth.serviceRoleKey}`
    );
    const liveChatSessionDb = new LiveChatSessionDbApi(DB_API_URL, context.jwtAuth.anonKey);
    const chatMessageDb = new ChatMessageDbApi(
        DB_API_URL,
        context.jwtAuth.serviceRoleKey,
        `Bearer ${context.jwtAuth.serviceRoleKey}`
    );
    const cxWebSocketConnectionDb = new CxWebSocketConnectionDbApi(
        DB_API_URL,
        context.jwtAuth.serviceRoleKey,
        `Bearer ${context.jwtAuth.serviceRoleKey}`
    );
    const cx360DialogStatusDb = new Cx360DialogStatusDbApi(
        DB_API_URL,
        context.jwtAuth.serviceRoleKey,
        `Bearer ${context.jwtAuth.serviceRoleKey}`
    );

    try {
        // [IM] skip validation, because it passed in integration lambda
        // await validateRequestEvent(event);
        const { sessionId, channelId, input: org_input, config, session, metadata } = event;

        // const locale = await detectLocale(input);
        // const localeId = getLocaleId(locale);
        // [IM] Hard code locale to en_US. this locale needed for Lex and Connect only, both not in use now, but this operation takes time
        const localeId = 'en_US';

        let input = org_input;

        if (MASKING_DATA_ENABLED) {
            try {
                input = await maskPii(org_input, 'en'); // [IM] Hardcoded because only 2 options: 'en' and 'es'.
            } catch (err) {
                console.error('Error while masking PII:', err);
            }
        }

        console.log('User Input:', input);

        const lastActivity = new Date().toISOString();
        await chatbotSessionDb.updateLastActivity(lastActivity, sessionId);

        const chatRequestMessage = {
            content: input,
            source: 'client',
            messageType: 'text',
            sessionId: sessionId,
            vendorMessageId: metadata.vendorMessageId,
        };
        const { chat_message_id } = await chatMessageDb.saveMessage(chatRequestMessage);

        if (session && session.connection_token) {
            await sendTextToLiveAgent(input, session.connection_token);
            return Responses.success;
        } else if (session && session.is_live_agent_connected && config.chatProvider === 'LiveChat') {
            // TODO [IM] are we sure string should be used here?
            const lcChat = await liveChatSessionDb.getChatBySessionId(sessionId);

            if (!lcChat.is_active) {
                console.error('>>>>> LiveChat Chat is not active');
                await chatbotSessionDb.updateConnectionFlag(sessionId, false);
            } else {
                try {
                    console.log('>>>>> Forward to LiveChat');
                    // [IM] Assuming that user cannot talk more than 4 hours per session
                    await sendTextToLiveChat(input, lcChat.customer_access_token, lcChat.chat_id, lcChat.organisation_id);
                    return Responses.success;
                } catch (e) {
                    console.log(e);
                    console.log(e?.response?.data);

                    if (e?.response?.data?.error?.type === 'chat_inactive') {
                        console.log('>>>>> Looks like closing chat event was missed');
                        await liveChatSessionDb.updateActivityFlag(lcChat.chat_id, false);
                        await chatbotSessionDb.updateConnectionFlag(sessionId, false);
                    }
                }
            }
        }

        // [IM] It placed after forwarding to live agent as it should be handled on live agent side separately
        // TODO [IM] move into resp-processing completely
        if (session.vendor_type === '360dialog') {
            console.log('>>>>> Sending Read to 360dialog');

            try {
                // console.log('>>>>> publishReadTo360Dialog placeholder');
                await publishReadTo360Dialog(metadata.vendorMessageId, channelId, true);
            } catch (err) {
                console.error('Error while sending read status to 360dialog', err);
            }
        }

        const chatRespMessageId = randomUUID();

        const args = {
            input,
            sessionId,
            localeId,
            config,
            chat_message_id,
            chatRespMessageId,
            // TODO [IM] Replace with fake get function?
            cxWebSocketConnectionDb: session.vendor_type === '360dialog' ? null : cxWebSocketConnectionDb,
        };

        let payload = {};
        if (hasFunctionConfigParams(config)) {
            payload = await processFunction(args);
        } else if (hasAgentConfigParams(config)) {
            payload = await processAgent(args);
        } else if (hasBotConfigParams(config)) {
            payload = await processBot(args);
        } else {
            throw new Error('Configuration is missing agent or bot params');
        }

        const answeredAt = new Date().toISOString();
        await chatMessageDb.setAnsweredAt(answeredAt, chat_message_id);

        payload.sessionId = sessionId;
        console.log('response-processing -> payload:', payload);
        // await invokeLambda('cx-response-processing', 'Event', payload);

        const chatResponseMessage = {
            content: payload.messageText,
            source: payload.from,
            messageType: 'text',
            sessionId: sessionId,
            messageId: chatRespMessageId,
            sources: payload.sources,
        };
        const { chat_message_id: chat_resp_message_id, created_at } = await chatMessageDb.saveMessage(chatResponseMessage);

        // TODO [IM] Move whole if-else to f2-utils? Stopping factor: Too many parameters need to be passed.
        //  can we combine all needed items into 2 objects payload or message AND session?
        if (session.vendor_type === '360dialog') {
            console.log('>>>>> Sending to 360dialog');

            try {
                // console.log('>>>>> publishTo360Dialog placeholder');
                await publishTo360Dialog(
                    payload.messageText,
                    channelId,
                    session.vendor_client_id,
                    config.accountId,
                    chat_resp_message_id,
                    chatMessageDb,
                    cx360DialogStatusDb
                );
            } catch (err) {
                console.error('Error while sending message to 360dialog', err);
            }
        } else {
            console.log('>>>>> Sending to Polling Queue');

            try {
                await publishToQueueForPolling(
                    payload.messageText,
                    sessionId,
                    payload.from,
                    payload.files,
                    payload.sources,
                    chat_resp_message_id,
                    created_at
                );
            } catch (err) {
                console.error('Error while sending message to polling queue', err);
            }
        }

        const analysisPayload = {
            sessionId,
            questionId: chat_message_id,
            answerId: chat_resp_message_id,
            question: input,
            answer: payload.messageText,
            accountId: config.accountId,
            channelId,
        };
        await sendMessageToAnalysisQueue(analysisPayload);

        return Responses.success;
    } catch (e) {
        console.error(e);
        return Responses.success;
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

const sendMessageToAnalysisQueue = async (payload) => {
    const params = {
        QueueUrl: RESPONSE_ANALYSIS_QUEUE,
        MessageBody: JSON.stringify(payload),
        MessageGroupId: payload.sessionId,
    };

    await sqsClient.send(new SendMessageToQueueCommand(params));
};

// const detectLocale = async (text) => {
//     const response = await comprehendClient.send(new DetectDominantLanguageCommand({ Text: text }));
//     const languages = response.Languages;
//     if (languages && languages.length > 0) {
//         return languages[0].LanguageCode;
//     }
// };

const maskPii = async (text, language) => {
    const params = {
        Text: text,
        LanguageCode: language,
    };

    const response = await comprehendClient.send(new DetectPiiEntitiesCommand(params));
    console.log(response.Entities);

    let _text = text;

    for (let item of response.Entities) {
        if (item.Score > PII_SCORE_THRESHOLD && !EXCLUDED_TYPES.includes(item.Type)) {
            _text =
                _text.slice(0, item.BeginOffset) + '*'.repeat(item.EndOffset - item.BeginOffset) + _text.slice(item.EndOffset);
        }
    }

    return _text;
};

const hasFunctionConfigParams = (config) => {
    return config.handlerType === 'lambda_function' && config.lambdaFunctionName;
};

const hasAgentConfigParams = (config) => {
    return config.handlerType === 'ai_agent' && config.aiAgentId && config.aiAgentAliasId;
};

const hasBotConfigParams = (config) => {
    return config.handlerType === 'legacy_bot' && config.botId && config.botAliasId;
};

const processAgent = async (params) => {
    const response = await sendTextToAIAgent(params);
    const payload = await decodeCompletionStream(response, params);

    const logEvents = createLogEvents(payload);
    const logStreamName = createLogStreamName(params);
    await sendMessagesToCloudWatch(TRACING_LOG_GROUP, logStreamName, logEvents);

    return payload;
};

const createLogEvents = (payload) => {
    const logEvents = [];
    for (const trace of payload.traces) {
        logEvents.push({
            timestamp: Number(trace.eventTime),
            message: JSON.stringify(trace),
        });
    }
    delete payload.traces;
    return logEvents.sort((a, b) => a.timestamp - b.timestamp);
};

const createLogStreamName = (params) => {
    return params.sessionId + '/' + params.chat_message_id;
};

const sendMessagesToCloudWatch = async (logGroupName, logStreamName, logEvents) => {
    try {
        await cloudWatchLogsClient.send(
            new PutLogEventsCommand({
                logGroupName,
                logStreamName,
                logEvents,
            })
        );
    } catch (error) {
        if (error.name === 'ResourceNotFoundException') {
            await cloudWatchLogsClient.send(
                new CreateLogStreamCommand({
                    logGroupName,
                    logStreamName,
                })
            );
            await sendMessagesToCloudWatch(logGroupName, logStreamName, logEvents);
        } else {
            console.error('Error sending logs to CloudWatch:', error);
        }
    }
};

const processBot = async (params) => {
    const lexResponse = await sendTextToLex(params);
    const lexResponsePayload = { ...lexResponse, ...params };
    const response = await invokeLambda('cx-lex-response-processing', 'RequestResponse', lexResponsePayload);
    const data = parseLambdaResponse(response);
    return { ...data, files: [], from: 'lex' };
};

const sendTextToLex = async ({ input, sessionId, localeId, config }) => {
    const params = {
        botId: config.botId,
        botAliasId: config.botAliasId,
        localeId: localeId,
        sessionId: sessionId,
        text: input,
    };

    return await lexRuntimeV2Client.send(new RecognizeTextCommand(params));
};

const sendTextToLiveAgent = async (input, connectionToken) => {
    const params = {
        Content: input,
        ContentType: 'text/plain',
        ConnectionToken: connectionToken,
    };

    return await participantClient.send(new SendMessageCommand(params));
};

const sendTextToLiveChat = async (input, customer_access_token, chat_id, organisation_id) => {
    const body = {
        chat_id: chat_id,
        event: {
            type: 'message',
            text: input,
        },
    };

    return await axios.post(
        `https://api.livechatinc.com/v3.5/customer/action/send_event?organization_id=${organisation_id}`,
        body,
        {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${customer_access_token}`,
            },
        }
    );
};

const sendTextToAIAgent = async ({ input, sessionId, localeId, config }) => {
    const params = {
        agentId: config.aiAgentId,
        agentAliasId: config.aiAgentAliasId,
        sessionId: sessionId,
        enableTrace: true,
        inputText: input,
        streamingConfigurations: {
            streamFinalResponse: true,
        },
        sessionState: {
            // TODO: add functionality to change knowledge base settings, for example - amount of retrieval chucks
            // knowledgeBaseConfigurations: [
            //     {
            //         knowledgeBaseId: '',
            //         retrievalConfiguration: {
            //             vectorSearchConfiguration: {
            //                 numberOfResults: 10,
            //             },
            //         },
            //     },
            // ],
            promptSessionAttributes: {
                sessionId: sessionId,
                localeId: localeId,
                chatProvider: config.chatProvider,
                chatInstanceId: config.chatInstanceId,
            },
            // TODO: conversationHistory – For multi-agent collaboration, accepts additional context for processing run time requests if conversationalHistorySharing is enabled for a collaborator agent.
        },
    };

    return await bedrockAgentRuntimeClient.send(new InvokeAgentCommand(params));
};

const invokeLambda = async (lambdaName, invocationType, payload) => {
    const params = {
        FunctionName: `${APP_NAME}-${lambdaName}-${ENV}`,
        InvocationType: invocationType,
        Payload: JSON.stringify(payload),
    };

    return await lambdaClient.send(new InvokeCommand(params));
};

const parseLambdaResponse = (response) => {
    const payloadString = new TextDecoder().decode(response.Payload);
    const payload = JSON.parse(payloadString);
    return JSON.parse(payload.body);
};

const decodeCompletionStream = async ({ completion }, { cxWebSocketConnectionDb, sessionId, chatRespMessageId }) => {
    if (completion === undefined) {
        throw new Error('Completion is undefined');
    }

    let result = {
        files: [],
        traces: [],
        sources: [],
        messageText: '',
        from: 'ai-agent',
    };

    const sendToWebSocket = createWsSender();
    let connections = [];

    if (cxWebSocketConnectionDb) {
        console.log('>>>>> DB Available');
        try {
            connections = await cxWebSocketConnectionDb.get(sessionId);
            if (connections.length > 1) {
                console.error(`Several (${connections.length}) connections have same sessionId`);
            }
        } catch (e) {
            console.error('Could not fetch WebSocket connection:', e);
        }
    }

    for await (const chunkEvent of completion) {
        if (chunkEvent.trace) {
            // console.log('Trace event:', JSON.stringify(chunkEvent.trace, null, 2));
            result.traces.push(chunkEvent.trace);
        }

        if (chunkEvent.files) {
            result.files = [...chunkEvent.files.files];
        }

        if (chunkEvent.chunk) {
            // TODO [IM] Not clear to me when 'citations' array will have more than 1 element
            if (chunkEvent.chunk.attribution?.citations?.length > 1) {
                console.log('>>>>> Citations Length more than 1');
                console.log(JSON.stringify(chunkEvent.chunk.attribution.citations));
            }

            if (chunkEvent.chunk.attribution?.citations?.[0]?.retrievedReferences) {
                const refs = chunkEvent.chunk.attribution.citations[0].retrievedReferences;

                for (const ref of refs) {
                    const sourceUri = ref?.metadata?.['x-amz-bedrock-kb-source-uri'] || ref?.location?.s3Location?.uri;
                    if (sourceUri) {
                        let filename;

                        if (sourceUri.endsWith('.html')) {
                            filename = sourceUri.split('/').pop().replace(/_/g, '/').replace('.html', '');
                        } else {
                            filename = sourceUri
                                .split(LLM_DATA_SOURCES_FOLDER)
                                .pop()
                                .replace(/^\/|\/$/g, '');
                        }

                        if (!result.sources.includes(filename)) {
                            // [IM] Prevent source duplication in case several chunks belong to the same file
                            result.sources.push(filename);
                        }
                    }
                }
            }

            const chunk = chunkEvent.chunk;
            const decodedResponse = new TextDecoder('utf-8').decode(chunk.bytes);
            result.messageText += decodedResponse;

            for (const connection of connections) {
                await sendToWebSocket(cxWebSocketConnectionDb, connection.connectionId, {
                    type: 'delta',
                    createdAt: Date.now(),
                    messageId: chatRespMessageId,
                    content: decodedResponse,
                    sources: result.sources,
                });
            }
        }
    }

    result.messageText = result.messageText
        .replace(/\\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

    for (const connection of connections) {
        await sendToWebSocket(cxWebSocketConnectionDb, connection.connectionId, {
            type: 'complete',
            createdAt: Date.now(),
            messageId: chatRespMessageId,
        });
    }

    return result;
};

const createWsSender = () => {
    const deadConnections = new Set();

    // [IM] This Closure needed to prevent a case when after getting 410 Gone connection was removed,
    // but cycle over chunkEvent continue requesting of sending over WebSocket function.
    // Sender has a dead list inside to prevent spamming database with delete requests.

    return async (cxWebSocketConnectionDb, connectionId, payload) => {
        if (!connectionId) {
            console.error('No WebSocket connectionId provided');
            return;
        }

        if (deadConnections.has(connectionId)) {
            console.error('ConnectionId is in dead list');
            return;
        }

        try {
            const params = {
                ConnectionId: connectionId,
                Data: JSON.stringify(payload),
            };
            await apiGwClient.send(new PostToConnectionCommand(params));
        } catch (e) {
            console.error('Failed to send to WebSocket:', e);

            if (e.statusCode === 410) {
                deadConnections.add(connectionId);
                await cxWebSocketConnectionDb.disconnect(connectionId);
                console.log(`Disconnected as Gone: ${connectionId}`);
            }
        }
    };
};

const processFunction = async ({ input, sessionId, localeId, config }) => {
    const response = await invokeLambda(config.lambdaFunctionName, 'RequestResponse', {
        input,
        sessionId,
        localeId,
        config,
    });
    const payloadString = new TextDecoder().decode(response.Payload);
    const payload = JSON.parse(payloadString);
    return {
        messageText: payload?.data?.messageText || '',
        sources: [],
        files: [],
        from: 'lambda-function',
    };
};
