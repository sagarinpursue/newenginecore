import pg from 'pg';

import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager'; // ES Modules import

export default class ManagerRDS {
    static initRDS = async (config = {}) => {
        const secretManagerClient = new SecretsManagerClient(config);
        const command = new GetSecretValueCommand({ SecretId: 'DEV/KPI/RDS' });
        const { SecretString } = await secretManagerClient.send(command);
        const response = JSON.parse(SecretString);

        process.env.PGUSER = response.username;
        process.env.PGPASSWORD = response.password;
        process.env.PGPORT = response.port;
        process.env.PGDATABASE = response.engine;

        return new ManagerRDS(response);
    };
    constructor(config = {}) {
        this.writerPool = this.#getPool(config.hostWriter);
        this.readerPool = this.#getPool(config.hostReader);
    }

    #getPool = (host) => {
        return new pg.Pool({
            host: host,
            max: 5,
            query_timeout: 10000,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        });
    };

    end = async () => {
        await this.writerPool.end();
        await this.readerPool.end();
    };
}
