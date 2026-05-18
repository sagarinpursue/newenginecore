import { promises as fs } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

import { APIGatewayClient, GetExportCommand, GetRestApisCommand } from '@aws-sdk/client-api-gateway';

import { getEnvironment } from '../../utils.js';

export const updateSwagger = async (environment) => {
    const config = (await import(`../../.environment/${environment}/config.js`)).default;
    try {
        const apiGatewayClient = new APIGatewayClient({
            profile: config.aws.profile,
            region: config.aws.region,
        });

        // Get list of all apis
        const command = new GetRestApisCommand({});
        const response = await apiGatewayClient.send(command);

        // Find the f2 api ID, then export swagger json
        for (let item of response.items) {
            if (item.name === config.aws.apiGateway.api.name) {
                const params = {
                    restApiId: item.id,
                    stageName: config.aws.apiGateway.api.stage,
                    exportType: 'oas30', // OpenAPI 3.0.x
                    accepts: 'application/json',
                };

                const command = new GetExportCommand(params);
                const response = await apiGatewayClient.send(command);

                const decoder = new TextDecoder();
                const swaggerFile = decoder.decode(response.body);
                const __dirname = dirname(fileURLToPath(import.meta.url));
                const swaggerFilePath = join(__dirname, '../swagger.json');

                // if file exists, replace it
                try {
                    await fs.unlink(swaggerFilePath);
                } catch (e) {
                    if (e.code !== 'ENOENT') {
                        throw e;
                    }
                }
                await fs.writeFile(swaggerFilePath, swaggerFile);

                console.log(`Successfully updated swagger file: ${swaggerFilePath}`);
            }
        }
    } catch (e) {
        console.error(e);
    }
};

if (import.meta.url === `file://${process.argv[1]}`) {
    (async () => {
        const environment = await getEnvironment();
        console.log('environment:', environment);
        await updateSwagger(environment);
    })();
}
