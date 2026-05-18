import axios from 'axios';

import { SecretsManagerClient, GetSecretValueCommand, PutSecretValueCommand } from '@aws-sdk/client-secrets-manager';

import { Responses } from '@shared-modules/f2-utils';

const AWS_REGION = process.env.AWS_REGION;

const secretsManagerClient = new SecretsManagerClient({ region: AWS_REGION });

export const handler = async (event) => {
    console.log('event:', JSON.stringify(event));

    const secretId = event.SecretId;
    const step = event.Step;

    if (step === 'finishSecret') {
        const secretValues = await getSecretValue(secretId);

        if (secretValues.expires_at && parseInt(secretValues.expires_at) - Date.now() < 90 * 60 * 1000) {
            console.log('>>>>> Token Expired');
            const clientId = secretId.split('/')[2].split('-')[0];
            const lcToken = await refreshToken(clientId, secretValues);
            await putSecretValue(secretId, secretValues, lcToken);
        }
    }

    return Responses.emptySuccess;
};

const getSecretValue = async (secretId) => {
    console.log('>>>>> Getting Secret Value');

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

const refreshToken = async (clientId, secretValues) => {
    console.log('>>>>> Refreshing LiveChat Token');

    const body = {
        grant_type: 'refresh_token',
        refresh_token: secretValues.refresh_token,
        client_id: clientId,
        client_secret: secretValues.client_secret,
    };

    const { data } = await axios.post('https://accounts.livechat.com/v2/token', body, {});

    return data;
};

const putSecretValue = async (secretId, secretValues, lcToken) => {
    console.log('>>>>> Updating Secret Value');

    const params = {
        SecretId: secretId,
        SecretString: JSON.stringify({
            client_secret: secretValues.client_secret,
            access_token: lcToken.access_token,
            refresh_token: lcToken.refresh_token,
            expires_at: Date.now() + lcToken.expires_in * 1000,
        }),
    };

    return secretsManagerClient.send(new PutSecretValueCommand(params));
};
