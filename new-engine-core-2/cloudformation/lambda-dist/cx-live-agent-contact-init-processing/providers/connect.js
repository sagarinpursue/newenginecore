import { ConnectClient, StartChatContactCommand, StartContactStreamingCommand } from '@aws-sdk/client-connect';
import { ConnectParticipantClient, CreateParticipantConnectionCommand } from '@aws-sdk/client-connectparticipant';

import { ChatbotSessionDbApi } from '@shared-modules/f2-db-api';

import ConnectContactDb from '../db/connect-contacts-db.js';

const AWS_REGION = process.env.AWS_REGION;
const DB_API_URL = process.env.DB_API_URL;
const ACCOUNT_ID = process.env.ACCOUNT_ID;

const connectClient = new ConnectClient({ region: AWS_REGION });
const participantClient = new ConnectParticipantClient({ region: AWS_REGION });

export const connect = async ({ config, user, keys }) => {
    const connectContactDb = new ConnectContactDb(DB_API_URL, keys.dbApiKey);
    const chatbotSessionDb = new ChatbotSessionDbApi(DB_API_URL, keys.dbServiceKey, `Bearer ${keys.dbServiceKey}`);

    const chatSession = await startChatContact(config);

    const contactData = {
        contact_id: chatSession.ContactId,
        session_id: config.sessionId,
        locale_id: config.localeId,
        email: user.email,
        full_name: user.fullName,
        phone_number: user.phoneNumber,
    };

    await connectContactDb.createContact(contactData);
    await startContactStreaming(chatSession.ContactId, config);

    const connection = await createParticipantConnection(chatSession.ParticipantToken);
    const connectionToken = connection.ConnectionCredentials.ConnectionToken;
    await chatbotSessionDb.updateConnectionToken(config.sessionId, connectionToken);
};

const startChatContact = async (config) => {
    const params = {
        InstanceId: config.connectInstanceId,
        ContactFlowId: config.connectFlowId,
        ParticipantDetails: { DisplayName: 'Guest' },
        Attributes: {
            sessionId: config.sessionId,
        },
    };

    return await connectClient.send(new StartChatContactCommand(params));
};

const startContactStreaming = async (contactId, config) => {
    const params = {
        InstanceId: config.connectInstanceId,
        ContactId: contactId,
        ChatStreamingConfiguration: {
            StreamingEndpointArn: `arn:aws:sns:${AWS_REGION}:${ACCOUNT_ID}:${config.connectStreamingEndpointTopic}`,
        },
    };

    return await connectClient.send(new StartContactStreamingCommand(params));
};

const createParticipantConnection = async (participantToken) => {
    const params = {
        Type: ['CONNECTION_CREDENTIALS'],
        ParticipantToken: participantToken,
        ConnectParticipant: true,
    };

    return await participantClient.send(new CreateParticipantConnectionCommand(params));
};
