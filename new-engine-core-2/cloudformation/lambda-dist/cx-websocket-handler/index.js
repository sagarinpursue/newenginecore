import jwt from 'jsonwebtoken';

import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi';

import middy from '@middy/core';
import inputOutputLogger from '@middy/input-output-logger';
import secretsManager from '@middy/secrets-manager';

import { CxWebSocketConnectionDbApi } from '@shared-modules/f2-db-api';

const AWS_REGION = process.env.AWS_REGION;
const DB_API_URL = process.env.DB_API_URL;
const WEBSOCKET_URL = process.env.WEBSOCKET_URL;
const JWT_AUTHORIZER_SECRET = process.env.JWT_AUTHORIZER_SECRET;

const apiGwClient = new ApiGatewayManagementApiClient({ region: AWS_REGION, endpoint: `https://${WEBSOCKET_URL}` });

export const handler = middy(async (event, context) => {
    const { connectionId, routeKey } = event.requestContext;

    console.log(`Event: ${routeKey} | Connection: ${connectionId}`);

    const cxWebSocketConnectionDb = new CxWebSocketConnectionDbApi(
        DB_API_URL,
        context.jwtAuth.serviceRoleKey,
        `Bearer ${context.jwtAuth.serviceRoleKey}`
    );

    try {
        switch (routeKey) {
            case '$connect':
                return await handleConnect(event, context, cxWebSocketConnectionDb);

            case '$disconnect':
                return await handleDisconnect(event, context, cxWebSocketConnectionDb);

            case 'ping':
                try {
                    const params = {
                        ConnectionId: connectionId,
                        Data: JSON.stringify({ type: 'pong' }),
                    };
                    await apiGwClient.send(new PostToConnectionCommand(params));

                    await cxWebSocketConnectionDb.extend(connectionId);
                } catch (e) {
                    console.error('Failed to send pong to WebSocket:', e);

                    if (e.statusCode === 410) {
                        await cxWebSocketConnectionDb.disconnect(connectionId);
                        console.log(`Disconnected as Gone: ${connectionId}`);
                    }
                }

                return { statusCode: 200 };

            default:
                return { statusCode: 400 };
        }
    } catch (err) {
        console.error('Handler Error:', err);
        return { statusCode: 500 };
    }
}).use([
    inputOutputLogger(),
    secretsManager({
        fetchData: {
            jwtAuth: JWT_AUTHORIZER_SECRET,
        },
        disablePrefetch: true,
        setToContext: true,
    }),
]);

async function handleConnect(event, context, cxWebSocketConnectionDb) {
    const { connectionId } = event.requestContext;
    const queryParams = event.queryStringParameters || {};

    const token = queryParams['X-F2-Auth-Token'];

    if (!token) {
        console.error('Rejected: Missing Auth Token');
        return { statusCode: 401 };
    }

    try {
        const decoded = jwt.verify(token, context.jwtAuth.jwtSecret);
        const sessionId = decoded.sessionId;

        if (!sessionId) {
            console.warn('Rejected: Token valid but missing sessionId');
            return { statusCode: 403 };
        }

        await cxWebSocketConnectionDb.connect(sessionId, connectionId);

        console.log(`Connected: ${sessionId} -> ${connectionId}`);

        return { statusCode: 200 };
    } catch (e) {
        console.error('Connect Failed:', e);
        return { statusCode: 403 };
    }
}

async function handleDisconnect(event, context, cxWebSocketConnectionDb) {
    const { connectionId } = event.requestContext;

    try {
        await cxWebSocketConnectionDb.disconnect(connectionId);

        console.log(`Disconnected: ${connectionId}`);

        return { statusCode: 200 };
    } catch (e) {
        console.error('Disconnect Cleanup Failed:', e);
        return { statusCode: 200 };
    }
}
