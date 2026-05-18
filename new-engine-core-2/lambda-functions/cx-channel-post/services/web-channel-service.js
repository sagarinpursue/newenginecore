import { randomUUID } from 'crypto';

import {
    CloudFrontClient,
    CreateDistributionCommand,
    CreateOriginAccessControlCommand,
    ListOriginAccessControlsCommand,
} from '@aws-sdk/client-cloudfront';
import { S3Client, GetBucketPolicyCommand, PutBucketPolicyCommand } from '@aws-sdk/client-s3';

const REGION = process.env.AWS_REGION;
const BUCKET_NAME = process.env.BUCKET_NAME;
const CX_CHANNELS_FOLDER = process.env.CX_CHANNELS_FOLDER;

const cloudfrontClient = new CloudFrontClient({ region: REGION });
const s3Client = new S3Client({ region: REGION });

export default class WebChannelService {
    #cxChannelDbApi;

    constructor(cxChannelDbApi) {
        this.#cxChannelDbApi = cxChannelDbApi;
    }

    async create(name, chatId, accountId) {
        const oac = await this.#createOriginAccessControl();
        console.log('WebChannelService -> create -> oac.Id = ', oac.Id);
        const distribution = await this.#createDistribution(oac.Id, name);
        console.log('WebChannelService -> create -> distribution.Id = ', distribution.Id);
        console.log('WebChannelService -> create -> distribution.ARN = ', distribution.ARN);
        console.log('WebChannelService -> create -> distribution.DomainName = ', distribution.DomainName);
        await this.#setBucketPolicy(distribution.Id, distribution.ARN, name);
        const channelId = randomUUID();
        await this.#cxChannelDbApi.create({
            channelId,
            name,
            channel: 'web',
            chatId,
            domainName: distribution.DomainName,
            distributionId: distribution.Id,
            accountId,
        });
    }

    async #createOriginAccessControl() {
        const oacName = 'oac-cx-channel';

        // Find existing OAC by name
        let marker = undefined;
        let existingOac = null;
        do {
            const listCommand = new ListOriginAccessControlsCommand({ Marker: marker });
            const listResponse = await cloudfrontClient.send(listCommand);
            if (listResponse.OriginAccessControlList?.Items) {
                existingOac = listResponse.OriginAccessControlList.Items.find((item) => item.Name === oacName);
                if (existingOac) {
                    break;
                }
            }
            marker = listResponse.OriginAccessControlList?.NextMarker;
        } while (marker);
        if (existingOac) {
            return existingOac;
        }

        // Create new OAC (if it doesn't exist yet)
        const oacResponse = await cloudfrontClient.send(
            new CreateOriginAccessControlCommand({
                OriginAccessControlConfig: {
                    Name: oacName,
                    OriginAccessControlOriginType: 's3',
                    SigningBehavior: 'always',
                    SigningProtocol: 'sigv4',
                    Description: `OAC for CX channel`,
                },
            })
        );
        return oacResponse.OriginAccessControl;
    }

    async #createDistribution(oacId, channelName) {
        const originId = `S3-${BUCKET_NAME}-${CX_CHANNELS_FOLDER}-${channelName}`;
        const params = {
            DistributionConfig: {
                CallerReference: `dist-${Date.now()}`,
                Comment: `CX Channel ${channelName}`,
                Enabled: true,
                DefaultRootObject: 'index.html',
                Origins: {
                    Quantity: 1,
                    Items: [
                        {
                            Id: originId,
                            DomainName: `${BUCKET_NAME}.s3.amazonaws.com`,
                            OriginPath: `/${CX_CHANNELS_FOLDER}/${channelName}`,
                            OriginAccessControlId: oacId,
                            S3OriginConfig: {
                                OriginAccessIdentity: '',
                            },
                        },
                    ],
                },
                DefaultCacheBehavior: {
                    TargetOriginId: originId,
                    ViewerProtocolPolicy: 'redirect-to-https',
                    AllowedMethods: {
                        Quantity: 2,
                        Items: ['GET', 'HEAD'],
                        CachedMethods: {
                            Quantity: 2,
                            Items: ['GET', 'HEAD'],
                        },
                    },
                    Compress: true,
                    ForwardedValues: {
                        QueryString: false,
                        Cookies: {
                            Forward: 'none',
                        },
                    },
                    MinTTL: 0,
                    DefaultTTL: 86400,
                    MaxTTL: 31536000,
                },
            },
        };
        console.log('WebChannelService -> #createDistribution -> params = ', JSON.stringify(params));
        const distributionResponse = await cloudfrontClient.send(new CreateDistributionCommand(params));
        return distributionResponse.Distribution;
    }

    async #setBucketPolicy(distributionId, distributionArn, channelName) {
        let policy = {
            Version: '2012-10-17',
            Statement: [],
        };
        const statementId = `AllowCloudFront-${distributionId}`;
        try {
            const getPolicyResponse = await s3Client.send(new GetBucketPolicyCommand({ Bucket: BUCKET_NAME }));
            policy = JSON.parse(getPolicyResponse.Policy);
        } catch (error) {
            console.error('WebChannelService -> #setBucketPolicy -> GetBucketPolicyCommand -> error:', error);
            if (error.name !== 'NoSuchBucketPolicy') {
                throw error;
            }
        }

        // Add distribution permission statement to bucket policy (if it doesn't exist yet)
        const isExistingStatement = policy.Statement.some((stmt) => stmt.Sid === statementId);
        if (isExistingStatement) {
            return; // Exit if the statement is already there.
        }
        const newStatement = {
            Sid: statementId,
            Effect: 'Allow',
            Principal: { Service: 'cloudfront.amazonaws.com' },
            Action: 's3:GetObject',
            Resource: `arn:aws:s3:::${BUCKET_NAME}/${CX_CHANNELS_FOLDER}/${channelName}/*`,
            Condition: {
                StringEquals: { 'AWS:SourceArn': distributionArn },
            },
        };
        policy.Statement.push(newStatement);

        await s3Client.send(
            new PutBucketPolicyCommand({
                Bucket: BUCKET_NAME,
                Policy: JSON.stringify(policy),
            })
        );
    }
}
