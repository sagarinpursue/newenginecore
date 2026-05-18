import middy from '@middy/core';
import inputOutputLogger from '@middy/input-output-logger';
import secretsManager from '@middy/secrets-manager';

import { CxWebSocketConnectionDbApi } from '@shared-modules/f2-db-api';

const DB_API_URL = process.env.DB_API_URL;
const JWT_AUTHORIZER_SECRET = process.env.JWT_AUTHORIZER_SECRET;

export const handler = middy(async (event, context) => {
    const cxWebSocketConnectionDb = new CxWebSocketConnectionDbApi(
        DB_API_URL,
        context.jwtAuth.serviceRoleKey,
        `Bearer ${context.jwtAuth.serviceRoleKey}`
    );

    try {
        const expiredConnection = await cxWebSocketConnectionDb.removeExpired();
        console.log(`Expired Connections: ${expiredConnection}`);

        // [IM] Plan B
        // const expiredConnection = await cxWebSocketConnectionDb.getExpired();
        // console.log(`Expired Connections: ${expiredConnection.length}`);
        //
        // const batchItems = [];
        // let items = [];
        //
        // expiredConnection.forEach((item, index) => {
        //     items.push(item.connectionId);
        //     if (items.length === 100 || index === expiredConnection.length - 1) {
        //         batchItems.push(items);
        //         items = [];
        //     }
        // });
        //
        // for (let batch of batchItems) {
        //     await cxWebSocketConnectionDb.removeExpired(batch);
        // }
    } catch (e) {
        console.error('Error in removing expired connections', e);
    }

    return { statusCode: 200 };
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
