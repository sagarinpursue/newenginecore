import middy from '@middy/core';
import secretsManager from '@middy/secrets-manager';

import AccountsDB from './data/accounts-db.js';
import ManagerSES from './managers/ses-manager.js';

const JWT_AUTHORIZER_SECRET = process.env.JWT_AUTHORIZER_SECRET;

export const handler = middy(async (event, context) => {
    console.log('event :>> ', event);
    try {
        const accountsDb = new AccountsDB(context.jwtAuth.serviceRoleKey);
        const listAccounts = await accountsDb.getListByNotLoadedReports();
        console.log('Find Accounts to send reminder:>> ', listAccounts.length);
        const managerSES = new ManagerSES();
        const listEmails = listAccounts.reduce((acc, account) => {
            acc.add(account.email_to_reminder);
            return acc;
        }, new Set());
        await managerSES.processingListEmails(listEmails);
    } catch (error) {
        console.error(error);
    }
    return 'Success';
}).use(
    secretsManager({
        fetchData: {
            jwtAuth: JWT_AUTHORIZER_SECRET,
        },
        disablePrefetch: true,
        setToContext: true,
    })
);
