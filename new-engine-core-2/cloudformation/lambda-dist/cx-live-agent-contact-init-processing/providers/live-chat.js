import axios from 'axios';

import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

import {
    ChatbotSessionDbApi,
    ChatMessageDbApi,
    LiveChatInstanceDbApi,
    LiveChatSessionDbApi,
    LiveChatThreadDbApi,
} from '@shared-modules/f2-db-api';

const ENV = process.env.ENV;
const AWS_REGION = process.env.AWS_REGION;
const DB_API_URL = process.env.DB_API_URL;

const secretsManagerClient = new SecretsManagerClient({ region: AWS_REGION });
const bedrockRuntimeClient = new BedrockRuntimeClient({ region: AWS_REGION });

// TODO [IM] This parameters needs to do moved to Parameter Store (CEF-I238)
const CHAT_SUMMARY_ENABLED = true;
const CHAT_SUMMARIZER_CONFIG = {
    model: 'amazon.nova-pro-v1:0',
    temperature: 0.1,
    topP: 0.2,
    prompt:
        'Role: You are an AI assistant that generates concise, accurate summaries of customer–chatbot conversations for a live human agent.\n' +
        '\n' +
        'Objective: Produce a short, clear, and actionable summary of the conversation so the agent immediately understands the customer’s issue, what has already been done, and what is expected next.\n' +
        '\n' +
        'Instructions:\n' +
        '1. Carefully read the entire conversation history between the customer and the chatbot.\n' +
        '2. Extract only essential information and omit any irrelevant details, small talk, repetition, disclaimers, or system messages.\n' +
        '3. The summary must:\n' +
        '- Identify the customer’s main request or problem\n' +
        '- List the key details provided by the customer\n' +
        '- Describe what actions the chatbot has already taken\n' +
        '- Highlight any blockers or unresolved issues\n' +
        '- State what the customer is expecting now\n' +
        '4. Do not add any information that is not present in the conversation.\n' +
        '5. Use a neutral, professional tone.\n' +
        '6. Keep the summary short and easy to read (4–6 bullet points, max 120 words).\n' +
        '7. Your output must contain only the summary. Do not add introductions, labels, explanations, or any other text.',
};

export const liveChatConnect = async ({ config, user, keys }) => {
    const chatbotSessionDb = new ChatbotSessionDbApi(DB_API_URL, keys.dbServiceKey, `Bearer ${keys.dbServiceKey}`);
    const chatMessageDb = new ChatMessageDbApi(DB_API_URL, keys.dbServiceKey, `Bearer ${keys.dbServiceKey}`);
    const liveChatInstanceDb = new LiveChatInstanceDbApi(DB_API_URL, keys.dbApiKey);
    const liveChatSessionDb = new LiveChatSessionDbApi(DB_API_URL, keys.dbApiKey);
    const liveChatThreadDb = new LiveChatThreadDbApi(DB_API_URL, keys.dbApiKey);

    const instance = await liveChatInstanceDb.getInstanceById(config.chatInstanceId);
    const secretValues = await getSecretValue(`${ENV}/lc/${instance.client_id}`);

    config.agentAccessToken = secretValues.access_token;
    config.organisationId = instance.organisation_id;

    const lcOldChat = await liveChatSessionDb.getChatBySessionId(config.sessionId);
    console.log('>>>>> Old Chat:', lcOldChat);

    if (!lcOldChat) {
        console.log('>>>>> LiveChat Chat not exist yet');
        const lcClient = await createClient(config);
        await updateClientInfo(config, lcClient, user);
        const lcNewChat = await initiateChat(config, lcClient);
        console.log('>>>>> LiveChat Chat:', lcNewChat);
        const preChatForm = `Pre-chat form\n\nName - الاسم:\n${user.fullName}\n\nPhone Number - رقم الهاتف:\n${user.phoneNumber}\n\nE-mail - البريد الالكتروني:\n${user.email}`;
        await sendTextToLiveChat(config, lcClient, lcNewChat, preChatForm);

        if (CHAT_SUMMARY_ENABLED) {
            console.log('>>>>> Send Summary 1');
            const history = await chatMessageDb.getMessagesBySessionId(config.sessionId);
            console.log(history);

            if (history.length) {
                const summary = await getSummary(JSON.stringify(history));
                const chatSummary = `Summary of the chat with a bot:\n\n${summary}`;
                await sendTextToLiveChat(config, lcClient, lcNewChat, chatSummary);
            }
        }

        const chatData = {
            chatId: lcNewChat.chat_id,
            sessionId: config.sessionId,
            organisationId: config.organisationId,
            customerAccessToken: lcClient.access_token,
            entityId: lcClient.entity_id,
            expiresIn: lcClient.expires_in,
            isActive: true,
            email: user.email,
            fullName: user.fullName,
            phoneNumber: user.phoneNumber,
        };

        const threadData = {
            chatId: lcNewChat.chat_id,
            threadId: lcNewChat.thread_id,
            sessionId: config.sessionId,
        };

        await liveChatSessionDb.createLiveChatConnection(chatData);
        await liveChatThreadDb.createLiveChatThread(threadData);
        await chatbotSessionDb.updateConnectionFlag(config.sessionId, true);
    } else {
        console.log('>>>>> LiveChat Chat already exist');

        // [IM] Always refresh customer token in case of returning to the old chat
        const lcClientToken = await refreshClient(config, lcOldChat);
        await liveChatSessionDb.updateClientToken(lcOldChat.chat_id, lcClientToken);
        await updateClientInfo(config, lcClientToken, user);
        const lcResumedChat = await resumeChat(config, lcClientToken, lcOldChat);
        console.log('>>>>> LiveChat Resumed Chat:', lcResumedChat);
        const preChatForm = `Pre-chat form\n\nName - الاسم:\n${user.fullName}\n\nPhone Number - رقم الهاتف:\n${user.phoneNumber}\n\nE-mail - البريد الالكتروني:\n${user.email}`;
        await sendTextToLiveChat(config, lcClientToken, lcOldChat, preChatForm);

        if (CHAT_SUMMARY_ENABLED) {
            console.log('>>>>> Send Summary 2');
            const history = await chatMessageDb.getMessagesBySessionId(config.sessionId);
            console.log(history);

            if (history.length) {
                const summary = await getSummary(JSON.stringify(history));
                const chatSummary = `Summary of the chat with a bot:\n\n${summary}`;
                await sendTextToLiveChat(config, lcClientToken, lcOldChat, chatSummary);
            }
        }

        const threadData = {
            chatId: lcOldChat.chat_id,
            threadId: lcResumedChat.thread_id,
            sessionId: config.sessionId,
        };

        await liveChatSessionDb.updateActivityFlag(lcOldChat.chat_id, true);
        await liveChatThreadDb.createLiveChatThread(threadData);
        await chatbotSessionDb.updateConnectionFlag(config.sessionId, true);
    }
};

const getSummary = async (history) => {
    const options = {
        modelId: CHAT_SUMMARIZER_CONFIG.model,
        messages: [{ role: 'user', content: [{ text: history }] }],
        system: [{ text: CHAT_SUMMARIZER_CONFIG.prompt }],
        inferenceConfig: {
            maxTokens: 4096,
            temperature: CHAT_SUMMARIZER_CONFIG.temperature,
            topP: CHAT_SUMMARIZER_CONFIG.topP,
        },
    };

    console.log('buildTask -> options:', JSON.stringify(options));

    const response = await bedrockRuntimeClient.send(new ConverseCommand(options));

    console.log('buildTask -> response:', JSON.stringify(response));

    return response?.output?.message?.content?.[0]?.text || 'error';
};

const getSecretValue = async (secretId) => {
    const params = {
        SecretId: secretId,
    };

    const secretValue = await secretsManagerClient.send(new GetSecretValueCommand(params));

    try {
        return JSON.parse(secretValue.SecretString);
    } catch (e) {
        console.log(e);
        return secretValue.SecretString;
    }
};

const refreshClient = async (config, chat) => {
    console.log('>>>>> Refreshing LiveChat Client');

    const body = {
        grant_type: 'agent_token',
        client_id: config.chatInstanceId,
        entity_id: chat.entity_id,
        response_type: 'token',
    };

    const { data } = await axios.post('https://accounts.livechat.com/v2/customer/token', body, {
        headers: {
            Authorization: `Bearer ${config.agentAccessToken}`,
        },
    });

    return data;
};

const createClient = async (config) => {
    console.log('>>>>> Creating LiveChat Client');

    const body = {
        grant_type: 'agent_token',
        client_id: config.chatInstanceId,
        response_type: 'token',
    };

    const { data } = await axios.post('https://accounts.livechat.com/v2/customer/token', body, {
        headers: {
            Authorization: `Bearer ${config.agentAccessToken}`,
        },
    });

    return data;
};

const updateClientInfo = async (config, client, info) => {
    console.log('>>>>> Updating LiveChat Client Info');

    const body = {
        name: info.fullName,
        email: info.email,
    };

    return await axios.post(
        `https://api.livechatinc.com/v3.5/customer/action/update_customer?organization_id=${config.organisationId}`,
        body,
        {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${client.access_token}`,
            },
        }
    );
};

const initiateChat = async (config, client) => {
    console.log('>>>>> Initiating LiveChat Chat');

    const { data } = await axios.post(
        `https://api.livechatinc.com/v3.5/customer/action/start_chat?organization_id=${config.organisationId}`,
        {},
        {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${client.access_token}`,
            },
        }
    );

    return data;
};

const resumeChat = async (config, client, chat) => {
    console.log('>>>>> Resuming LiveChat Chat');

    const body = {
        chat: {
            id: chat.chat_id,
        },
    };

    const { data } = await axios.post(
        `https://api.livechatinc.com/v3.5/customer/action/resume_chat?organization_id=${config.organisationId}`,
        body,
        {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${client.access_token}`,
            },
        }
    );

    return data;
};

const sendTextToLiveChat = async (config, client, chat, input) => {
    const body = {
        chat_id: chat.chat_id,
        event: {
            type: 'message',
            text: input,
        },
    };

    return await axios.post(
        `https://api.livechatinc.com/v3.5/customer/action/send_event?organization_id=${config.organisationId}`,
        body,
        {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${client.access_token}`,
            },
        }
    );
};
