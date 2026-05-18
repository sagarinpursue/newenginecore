import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

import { Client } from 'pg';
import format from 'pg-format';

import cloudformationResponse from '@middy/cloudformation-response';
import cloudformationRouterHandler from '@middy/cloudformation-router';
import middy from '@middy/core';
import inputOutputLogger from '@middy/input-output-logger';
import secretsManager from '@middy/secrets-manager';

import { cloudformationSendResponse } from '@shared-modules/f2-middlewares';

const MASTER_CREDENTIALS_SECRET = process.env.MASTER_CREDENTIALS_SECRET;

const DB_HOST = process.env.DB_HOST;
const DB_PORT = process.env.DB_PORT;
const DB_DATABASE = process.env.DB_DATABASE;

const listObjects = (path) => {
    return fs
        .readdirSync(path, { withFileTypes: true })
        .reduce((fileNames, item) => {
            if (item.isDirectory()) {
                const files = listObjects(`${item.parentPath}/${item.name}`);
                return fileNames.concat(files);
            } else {
                return item.name.toLowerCase().endsWith('.sql') ? fileNames.concat(`${item.parentPath}/${item.name}`) : fileNames;
            }
        }, [])
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
};

const getMigratedFiles = async (client) => {
    try {
        const res = await client.query('SELECT migration_hash_script FROM f2_migrations_log');
        return new Set(res.rows.map((row) => row.migration_hash_script));
    } catch (error) {
        console.error('❌ Error: ', error);
        return new Set();
    }
};

const logMigrations = async (client, migrations) => {
    try {
        const sqlQuery = format('INSERT INTO f2_migrations_log (migration_hash_script) VALUES %L', migrations);
        await client.query(sqlQuery);
    } catch (error) {
        console.error('❌ Error: ', error);
    }
};

export const lambdaHandler = async (event, context) => {
    const { pgCredentials } = context;
    const { module = 'postgres-init' } = event.ResourceProperties;

    let client = null;
    try {
        console.time('Migrations Scripts');
        client = new Client({
            host: DB_HOST,
            port: DB_PORT,
            user: pgCredentials.username,
            password: pgCredentials.password,
            database: DB_DATABASE,
            ssl: { rejectUnauthorized: true },
        });
        await client.connect();

        const fileNames = listObjects(path.join('.', `migrations-scripts`, module).normalize());

        const listMigratedFiles = await getMigratedFiles(client);

        const newMigrations = [];

        for (const file of fileNames) {
            console.log('📔 Processing file :>> ', file);
            const sql = fs
                .readFileSync(file)
                .toString()
                .replace(/--.+/g, '')
                .replaceAll('${PASSWORD}', pgCredentials.password)
                .replaceAll('${USER}', pgCredentials.username);

            const hash = crypto.createHash('sha256').update(sql).digest('hex');

            if (listMigratedFiles.has(hash)) {
                console.log('⚠️  Skipping already migrated file :>> ', file);
                continue;
            }

            try {
                await client.query(sql);
                console.log('✅ Finish processing file :>> ', file);
                newMigrations.push([hash]);
            } catch (error) {
                console.error('❌ Error: ', error);
            }
        }

        if (newMigrations.length > 0) {
            await logMigrations(client, newMigrations);
        }
    } catch (error) {
        console.error('❌ Error: ', error);
        throw error;
    } finally {
        await client?.end();
        console.timeEnd('Migrations Scripts');
    }

    return {
        PhysicalResourceId: `resource-${event.LogicalResourceId}-${new Date().getTime()}`,
        Data: {
            Message: 'Successfully executed',
        },
    };
};

export const migrationHandler = middy()
    .use([
        secretsManager({
            fetchData: {
                pgCredentials: MASTER_CREDENTIALS_SECRET,
            },
            disablePrefetch: true,
            setToContext: true,
        }),
    ])
    .handler(lambdaHandler);

const skipHandler = middy().handler(() => {
    return {
        Data: {
            Message: 'Skipped executed',
        },
    };
});

export const handler = middy()
    .use([inputOutputLogger(), cloudformationSendResponse(), cloudformationResponse()])
    .handler(
        cloudformationRouterHandler([
            {
                requestType: 'Create',
                handler: migrationHandler,
            },
            {
                requestType: 'Update',
                handler: migrationHandler,
            },
            {
                requestType: 'Delete',
                handler: skipHandler,
            },
        ])
    );
