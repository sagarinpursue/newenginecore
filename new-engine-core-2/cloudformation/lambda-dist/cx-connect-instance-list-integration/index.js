import { ConnectClient, DescribeInstanceCommand } from '@aws-sdk/client-connect';

import middy from '@middy/core';
import httpJsonBodyParser from '@middy/http-json-body-parser';
import inputOutputLogger from '@middy/input-output-logger';
import secretsManager from '@middy/secrets-manager';
import validator from '@middy/validator';

import Ajv from 'ajv';
import ajvErrors from 'ajv-errors';
import ajvFormats from 'ajv-formats';

// Custom Node modules
import { CxConnectInstanceDbApi } from '@shared-modules/f2-db-api';
import { httpResponseFormatter, httpErrorFormatter } from '@shared-modules/f2-middlewares';

import { eventSchema } from './schemas/event.js';

// Create AJV instance and configure it with ajv-errors and ajv-formats
const ajv = new Ajv({ coerceTypes: 'number', strictTypes: false, allowUnionTypes: true, allErrors: true });
ajvFormats(ajv);
ajvErrors(ajv);

const JWT_AUTHORIZER_SECRET = process.env.JWT_AUTHORIZER_SECRET;
const DB_API_URL = process.env.DB_API_URL;
const AWS_REGION = process.env.AWS_REGION;

const connectClient = new ConnectClient({ region: AWS_REGION });

export const handler = middy(async (event, context) => {
    const { Authorization } = event.headers;
    const connectInstanceDb = new CxConnectInstanceDbApi(DB_API_URL, context.jwtAuth.anonKey, Authorization);
    const instances = await connectInstanceDb.getList();
    const data = await getInstanceDetailsForAll(instances);
    return { data };
}).use([
    inputOutputLogger(),
    httpJsonBodyParser({
        disableContentTypeError: true,
    }),
    secretsManager({
        fetchData: {
            jwtAuth: JWT_AUTHORIZER_SECRET,
        },
        disablePrefetch: true,
        setToContext: true,
    }),
    validator({ eventSchema: ajv.compile(eventSchema) }),
    httpResponseFormatter(),
    httpErrorFormatter(),
]);

async function getInstanceDetailsForAll(instances) {
    return await Promise.all(instances.map((instance) => getInstanceDetails(instance)));
}

async function getInstanceDetails(instance) {
    const command = new DescribeInstanceCommand({ InstanceId: instance.instance_id });
    const response = await connectClient.send(command);
    return {
        instanceId: response.Instance.Id,
        instanceRegion: instance.region,
        instanceCcpUrl: instance.ccp_url,
        instanceAlias: response.Instance.InstanceAlias,
        instanceStatus: response.Instance.InstanceStatus,
        instanceAccessUrl: response.Instance.InstanceAccessUrl,
        inboundCallsEnabled: response.Instance.InboundCallsEnabled,
        outboundCallsEnabled: response.Instance.OutboundCallsEnabled,
        createdAt: response.Instance.CreatedTime,
        updatedAt: instance.updated_at,
    };
}
