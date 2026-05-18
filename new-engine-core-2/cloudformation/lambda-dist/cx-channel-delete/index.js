// Native and 3rd party Node modules
import { CloudFrontClient, GetDistributionConfigCommand, UpdateDistributionCommand } from '@aws-sdk/client-cloudfront';
import {
    S3Client,
    PutBucketPolicyCommand,
    GetBucketPolicyCommand,
    DeleteBucketPolicyCommand,
    ListObjectsV2Command,
    DeleteObjectsCommand,
} from '@aws-sdk/client-s3';
import { SecretsManagerClient, DeleteSecretCommand } from '@aws-sdk/client-secrets-manager';

import middy from '@middy/core';
import httpJsonBodyParser from '@middy/http-json-body-parser';
import inputOutputLogger from '@middy/input-output-logger';
import secretsManager from '@middy/secrets-manager';
import validator from '@middy/validator';

import Ajv from 'ajv';
import ajvErrors from 'ajv-errors';
import ajvFormats from 'ajv-formats';

import { CxChannelDbApi } from '@shared-modules/f2-db-api';
import { httpErrorFormatter, httpResponseFormatter } from '@shared-modules/f2-middlewares';

import { eventSchema } from './schemas/event.js';

// System env vars
const ENV = process.env.ENV;
const REGION = process.env.AWS_REGION;
const DB_API_URL = process.env.DB_API_URL;
const JWT_AUTHORIZER_SECRET = process.env.JWT_AUTHORIZER_SECRET;
const BUCKET_NAME = process.env.BUCKET_NAME;
const CX_CHANNELS_FOLDER = process.env.CX_CHANNELS_FOLDER;

// Create AJV instance and configure it with ajv-errors and ajv-formats
const ajv = new Ajv({ coerceTypes: 'number', strictTypes: false, allowUnionTypes: true, allErrors: true });
ajvFormats(ajv);
ajvErrors(ajv);

const secretsManagerClient = new SecretsManagerClient({ region: REGION });
const cloudfrontClient = new CloudFrontClient({ region: REGION });
const s3Client = new S3Client({ region: REGION });

export const handler = middy(async (event, context) => {
    const token = event.headers.Authorization;

    const cxChannelDbApi = new CxChannelDbApi(DB_API_URL, context.jwtAuth.anonKey, token);

    const channelId = event.queryStringParameters.channelId;
    console.log('channelId = ', channelId);
    const channel = await cxChannelDbApi.get(channelId);
    console.log('channel = ', channel);

    if (!channel) {
        return {};
    }

    if (channel.channel === '360dialog') {
        const params = {
            SecretId: `f2-${ENV}/cx/channel-vendor-secret/${channelId}`,
            ForceDeleteWithoutRecovery: true,
        };

        await secretsManagerClient.send(new DeleteSecretCommand(params));
    }

    if (channel.distributionId) {
        await disableDistribution(channel.distributionId);
        // TODO: delete distribution once disabled (it can take 5-15 minutes or more)
        await setBucketPolicy(channel.distributionId);
    }

    if (channel.name && channel.channel === 'web') {
        await deleteS3Folder(channel.name);
    }

    await cxChannelDbApi.remove(channelId);

    return {};
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

const disableDistribution = async (distributionId) => {
    const distributionConfigResponse = await cloudfrontClient.send(new GetDistributionConfigCommand({ Id: distributionId }));
    const distributionConfig = distributionConfigResponse.DistributionConfig;
    if (distributionConfig.Enabled) {
        distributionConfig.Enabled = false;
        await cloudfrontClient.send(
            new UpdateDistributionCommand({
                Id: distributionId,
                DistributionConfig: distributionConfig,
                IfMatch: distributionConfigResponse.ETag,
            })
        );
    }
};

const setBucketPolicy = async (distributionId) => {
    let policy = {
        Version: '2012-10-17',
        Statement: [],
    };
    const statementId = `AllowCloudFront-${distributionId}`;
    try {
        const getPolicyResponse = await s3Client.send(new GetBucketPolicyCommand({ Bucket: BUCKET_NAME }));
        policy = JSON.parse(getPolicyResponse.Policy);
    } catch (error) {
        console.error('setBucketPolicy -> GetBucketPolicyCommand -> error:', error);
        if (error.name !== 'NoSuchBucketPolicy') {
            throw error;
        }
    }

    // Remove distribution permission statement from bucket policy (if it exists)
    const distributionStatementIndex = policy.Statement.findIndex((stmt) => stmt.Sid === statementId);
    if (distributionStatementIndex >= 0) {
        policy.Statement.splice(distributionStatementIndex, 1);
    }

    if (policy.Statement.length) {
        await s3Client.send(
            new PutBucketPolicyCommand({
                Bucket: BUCKET_NAME,
                Policy: JSON.stringify(policy),
            })
        );
    } else {
        // if no more statements remain then remove policy
        await s3Client.send(
            new DeleteBucketPolicyCommand({
                Bucket: BUCKET_NAME,
            })
        );
    }
};

const deleteS3Folder = async (channelName) => {
    let isTruncated = true;
    let continuationToken = undefined;

    while (isTruncated) {
        const listParams = {
            Bucket: BUCKET_NAME,
            Prefix: `${CX_CHANNELS_FOLDER}/${channelName}/`,
            ContinuationToken: continuationToken,
        };

        const { Contents = [], IsTruncated, NextContinuationToken } = await s3Client.send(new ListObjectsV2Command(listParams));

        const objectsToDelete = Contents.map(({ Key }) => {
            return { Key };
        });
        console.log('deleteS3Folder -> objectsToDelete:', objectsToDelete.length);

        if (objectsToDelete.length > 0) {
            const deleteParams = {
                Bucket: BUCKET_NAME,
                Delete: { Objects: objectsToDelete, Quiet: true },
            };
            await s3Client.send(new DeleteObjectsCommand(deleteParams));
        }

        isTruncated = IsTruncated;
        continuationToken = NextContinuationToken;
    }
};
