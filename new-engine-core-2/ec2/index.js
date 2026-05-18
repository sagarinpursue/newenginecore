import path from 'path';
import { fileURLToPath } from 'url';

import {
    AttachLoadBalancerTargetGroupsCommand,
    AutoScalingClient,
    CreateAutoScalingGroupCommand,
    DescribeAutoScalingGroupsCommand,
    DetachLoadBalancerTargetGroupsCommand,
    UpdateAutoScalingGroupCommand,
} from '@aws-sdk/client-auto-scaling';
import {
    EC2Client,
    DescribeImagesCommand,
    CreateSecurityGroupCommand,
    DescribeSecurityGroupsCommand,
    CreateLaunchTemplateCommand,
    AuthorizeSecurityGroupIngressCommand,
    AuthorizeSecurityGroupEgressCommand,
    ModifySecurityGroupRulesCommand,
    DescribeLaunchTemplatesCommand,
    ModifyLaunchTemplateCommand,
    CreateLaunchTemplateVersionCommand,
} from '@aws-sdk/client-ec2';
import {
    ElasticLoadBalancingV2Client,
    CreateLoadBalancerCommand,
    CreateTargetGroupCommand,
    RegisterTargetsCommand,
    CreateListenerCommand,
    DescribeTargetGroupsCommand,
    DescribeLoadBalancersCommand,
    SetSubnetsCommand,
    SetSecurityGroupsCommand,
    DescribeListenersCommand,
    DeleteListenerCommand,
    DeleteTargetGroupCommand,
    DescribeTargetHealthCommand,
    DeregisterTargetsCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
    IAMClient,
    CreateInstanceProfileCommand,
    AddRoleToInstanceProfileCommand,
    GetInstanceProfileCommand,
} from '@aws-sdk/client-iam';
import { ModifyDBClusterCommand, RDSClient } from '@aws-sdk/client-rds';

import { getFiles } from '../utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async (environment) => {
    console.log('EC2 -> started');

    const config = (await import(`../.environment/${environment}/config.js`)).default;
    const ec2Client = new EC2Client({
        profile: config.aws.profile,
        region: config.aws.region,
    });
    const rdsClient = new RDSClient({
        profile: config.aws.profile,
        region: config.aws.region,
    });
    const elbV2Client = new ElasticLoadBalancingV2Client({
        profile: config.aws.profile,
        region: config.aws.region,
    });
    const autoScalingClient = new AutoScalingClient({
        profile: config.aws.profile,
        region: config.aws.region,
    });
    const iamClient = new IAMClient({
        profile: config.aws.profile,
        region: config.aws.region,
    });

    try {
        const folders = ['list'];

        for (const folder of folders) {
            console.log('EC2 -> folder:', folder);
            const files = await getFiles(path.join(__dirname, folder));
            console.log('EC2 -> files:', files);
            const ec2List = (await Promise.all(files.map((file) => (async (file) => import(`./${folder}/${file}`))(file)))).map(
                (module) => module.default(config)
            );

            for (const ec2 of ec2List) {
                console.log('EC2 -> ec2.name:', ec2.name);

                // Create/Update Security Groups
                const ec2SecurityGroupId = await createSecurityGroup(ec2Client, ec2.securityGroup.ec2Instance, ec2.vpc.id);
                console.log('EC2 -> ec2SecurityGroupId:', ec2SecurityGroupId);
                const rdsSecurityGroupId = await createSecurityGroup(ec2Client, ec2.securityGroup.rdsCluster, ec2.vpc.id);
                console.log('EC2 -> rdsSecurityGroupId:', rdsSecurityGroupId);

                // TODO: specify link in ec2 file
                await linkSecurityGroups(ec2Client, ec2SecurityGroupId, rdsSecurityGroupId); // run only 1 time

                // Attach security group to RDS cluster
                await rdsClient.send(
                    new ModifyDBClusterCommand({
                        DBClusterIdentifier: ec2.rdsCluster,
                        VpcSecurityGroupIds: [ec2.vpc.securityGroups, rdsSecurityGroupId],
                        ApplyImmediately: true,
                    })
                );

                // Create/Update Launch Template
                const instanceProfileArn = await createInstanceProfile(iamClient, ec2.launchTemplate);
                const launchTemplateId = await createLaunchTemplate(
                    ec2Client,
                    ec2.launchTemplate,
                    ec2SecurityGroupId,
                    instanceProfileArn
                );
                console.log('EC2 -> launchTemplateId:', launchTemplateId);

                // Create new Target Group (because the existing group can't be updated)
                // Initial Step: Get target groups are currently in use to move targets and remove target groups later
                let loadBalancerArn = await getLoadBalancer(elbV2Client, ec2.loadBalancer);
                const existingTargetGroupArns = loadBalancerArn
                    ? await getExistingTargetGroupArns(elbV2Client, loadBalancerArn)
                    : [];
                console.log('EC2 -> existingTargetGroupArns:', existingTargetGroupArns);
                const targetGroupArn = await createTargetGroup(elbV2Client, ec2.targetGroup, ec2.vpc.id);
                console.log('EC2 -> targetGroupArn:', targetGroupArn);

                // Create/Update Load Balancer (update is limited)
                loadBalancerArn = await createLoadBalancer(
                    elbV2Client,
                    ec2.loadBalancer,
                    ec2.targetGroup,
                    ec2SecurityGroupId,
                    targetGroupArn
                );
                console.log('EC2 -> loadBalancerArn:', loadBalancerArn);

                // Create/Update Auto Scaling Group
                await createAutoScalingGroup(
                    autoScalingClient,
                    ec2.autoScalingGroup,
                    launchTemplateId,
                    targetGroupArn,
                    existingTargetGroupArns
                );

                if (existingTargetGroupArns.length) {
                    // Move Targets to new Target Group
                    await moveTargetsToNewTargetGroup(elbV2Client, existingTargetGroupArns, targetGroupArn);
                    // Remove unused Target Group(s)
                    await removeTargetGroups(elbV2Client, existingTargetGroupArns);
                }

                console.log('EC2 -> deployed');
            }
        }
        console.log('EC2 -> succeeded');
    } catch (e) {
        console.log('EC2 -> failed:', e);
    }
};

const findAmiId = async (ec2Client, amiParams) => {
    const params = {
        Filters: [
            { Name: 'name', Values: [amiParams.name] },
            { Name: 'architecture', Values: [amiParams.architecture] },
            { Name: 'virtualization-type', Values: [amiParams.virtualization] },
            { Name: 'owner-id', Values: [amiParams.owner] },
        ],
    };
    const result = await ec2Client.send(new DescribeImagesCommand(params));
    const latestImage = result.Images.sort((a, b) => new Date(b.CreationDate) - new Date(a.CreationDate))[0];
    if (!latestImage) {
        throw new Error('No AMI found');
    }
    return latestImage.ImageId;
};

const createSecurityGroup = async (ec2Client, securityGroupParams, vpcId) => {
    let result = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
            Filters: [
                { Name: 'group-name', Values: [securityGroupParams.name] },
                { Name: 'vpc-id', Values: [vpcId] },
            ],
        })
    );
    if (result.SecurityGroups.length > 0) {
        return result.SecurityGroups[0].GroupId;
    }

    result = await ec2Client.send(
        new CreateSecurityGroupCommand({
            GroupName: securityGroupParams.name,
            Description: securityGroupParams.description,
            VpcId: vpcId,
        })
    );

    if (securityGroupParams.inboundRules?.length) {
        const inboundRulesResult = await ec2Client.send(
            new AuthorizeSecurityGroupIngressCommand({
                GroupId: result.GroupId,
                IpPermissions: securityGroupParams.inboundRules.map((rule) => ({
                    IpProtocol: rule.protocol,
                    FromPort: rule.fromPort,
                    ToPort: rule.toPort,
                    IpRanges: [{ CidrIp: rule.cidrIp }],
                })),
            })
        );
        await modifySecurityGroupRules(
            ec2Client,
            result.GroupId,
            inboundRulesResult.SecurityGroupRules,
            securityGroupParams.inboundRules
        );
    }
    if (securityGroupParams.outboundRules?.length) {
        const outboundRulesResult = await ec2Client.send(
            new AuthorizeSecurityGroupEgressCommand({
                GroupId: result.GroupId,
                IpPermissions: securityGroupParams.outboundRules.map((rule) => ({
                    IpProtocol: rule.protocol,
                    FromPort: rule.fromPort,
                    ToPort: rule.toPort,
                    IpRanges: [{ CidrIp: rule.cidrIp }],
                })),
            })
        );
        await modifySecurityGroupRules(
            ec2Client,
            result.GroupId,
            outboundRulesResult.SecurityGroupRules,
            securityGroupParams.outboundRules
        );
    }

    return result.GroupId;
};

const modifySecurityGroupRules = async (ec2Client, securityGroupId, addedRules, rules) => {
    await ec2Client.send(
        new ModifySecurityGroupRulesCommand({
            GroupId: securityGroupId,
            SecurityGroupRules: addedRules.map((addedRule) => ({
                SecurityGroupRuleId: addedRule.SecurityGroupRuleId,
                SecurityGroupRule: {
                    Description: rules.find((rule) => rule.toPort === addedRule.ToPort && rule.fromPort === addedRule.FromPort)
                        ?.description,
                    IpProtocol: addedRule.IpProtocol,
                    FromPort: addedRule.FromPort,
                    ToPort: addedRule.ToPort,
                    CidrIpv4: addedRule.CidrIpv4,
                },
            })),
        })
    );
};

const linkSecurityGroups = async (ec2Client, sourceSecurityGroupId, destinationSecurityGroupId) => {
    await ec2Client
        .send(
            new AuthorizeSecurityGroupEgressCommand({
                GroupId: sourceSecurityGroupId,
                IpPermissions: [
                    {
                        IpProtocol: 'tcp',
                        FromPort: 5432,
                        ToPort: 5432,
                        UserIdGroupPairs: [{ GroupId: destinationSecurityGroupId }],
                    },
                ],
            })
        )
        .catch(console.log);
    await ec2Client
        .send(
            new AuthorizeSecurityGroupIngressCommand({
                GroupId: destinationSecurityGroupId,
                IpPermissions: [
                    {
                        IpProtocol: 'tcp',
                        FromPort: 5432,
                        ToPort: 5432,
                        UserIdGroupPairs: [{ GroupId: sourceSecurityGroupId }],
                    },
                ],
            })
        )
        .catch(console.log);
};

const createInstanceProfile = async (iamClient, launchTemplateParams) => {
    let result = await iamClient
        .send(new GetInstanceProfileCommand({ InstanceProfileName: launchTemplateParams.instanceProfileName }))
        .catch((err) => {
            if (err.name === 'NoSuchEntityException') {
                return null;
            } else {
                throw err;
            }
        });
    if (result?.InstanceProfile?.Arn) {
        return result.InstanceProfile.Arn;
    }

    await iamClient.send(new CreateInstanceProfileCommand({ InstanceProfileName: launchTemplateParams.instanceProfileName }));
    await iamClient.send(
        new AddRoleToInstanceProfileCommand({
            InstanceProfileName: launchTemplateParams.instanceProfileName,
            RoleName: launchTemplateParams.roleName,
        })
    );

    await new Promise((resolve) => setTimeout(resolve, 5000));

    result = await iamClient.send(
        new GetInstanceProfileCommand({ InstanceProfileName: launchTemplateParams.instanceProfileName })
    );

    return result.InstanceProfile.Arn;
};

const createLaunchTemplate = async (ec2Client, launchTemplateParams, ec2SecurityGroupId, instanceProfileArn) => {
    let result = await ec2Client
        .send(
            new DescribeLaunchTemplatesCommand({
                LaunchTemplateNames: [launchTemplateParams.name],
            })
        )
        .catch((err) => {
            if (err.name === 'InvalidLaunchTemplateName.NotFoundException') {
                return null;
            } else {
                throw err;
            }
        });

    if (result?.LaunchTemplates?.length > 0) {
        // Create a new launch template version
        const newVersionResponse = await ec2Client.send(
            new CreateLaunchTemplateVersionCommand({
                LaunchTemplateId: result.LaunchTemplates[0].LaunchTemplateId,
                SourceVersion: '$Latest', // Base the new version on the latest version
                LaunchTemplateData: {
                    InstanceType: launchTemplateParams.instanceType,
                    KeyName: launchTemplateParams.keyPair,
                    // SecurityGroupIds: [ec2SecurityGroupId], // moved to NetworkInterfaces
                    UserData: Buffer.from(launchTemplateParams.userData).toString('base64'),
                    NetworkInterfaces: [
                        {
                            AssociatePublicIpAddress: true,
                            DeviceIndex: 0,
                            SubnetId: launchTemplateParams.subnets[0],
                            Groups: [ec2SecurityGroupId],
                        },
                    ],
                    BlockDeviceMappings: [
                        {
                            DeviceName: '/dev/sda1',
                            Ebs: {
                                VolumeSize: launchTemplateParams.volumeSize,
                                VolumeType: 'gp2',
                                DeleteOnTermination: true,
                            },
                        },
                    ],
                    IamInstanceProfile: { Arn: instanceProfileArn },
                },
            })
        );
        const newVersion = newVersionResponse.LaunchTemplateVersion.VersionNumber;

        // Optional: Set the new version as the default
        await ec2Client.send(
            new ModifyLaunchTemplateCommand({
                LaunchTemplateId: result.LaunchTemplates[0].LaunchTemplateId,
                DefaultVersion: newVersion.toString(),
            })
        );
        console.log('EC2 -> createLaunchTemplate -> updated');
        return result.LaunchTemplates[0].LaunchTemplateId;
    } else {
        const amiId = await findAmiId(ec2Client, launchTemplateParams.ami);

        result = await ec2Client.send(
            new CreateLaunchTemplateCommand({
                LaunchTemplateName: launchTemplateParams.name,
                LaunchTemplateData: {
                    ImageId: amiId,
                    InstanceType: launchTemplateParams.instanceType,
                    KeyName: launchTemplateParams.keyPair,
                    // SecurityGroupIds: [ec2SecurityGroupId], // Moved to NetworkInterfaces
                    UserData: Buffer.from(launchTemplateParams.userData).toString('base64'),
                    NetworkInterfaces: [
                        {
                            AssociatePublicIpAddress: true,
                            DeviceIndex: 0,
                            SubnetId: launchTemplateParams.subnets[0],
                            Groups: [ec2SecurityGroupId],
                        },
                    ],
                    BlockDeviceMappings: [
                        {
                            DeviceName: '/dev/sda1',
                            Ebs: {
                                VolumeSize: launchTemplateParams.volumeSize,
                                VolumeType: 'gp2',
                                DeleteOnTermination: true,
                            },
                        },
                    ],
                    IamInstanceProfile: { Arn: instanceProfileArn },
                },
            })
        );
        console.log('EC2 -> createLaunchTemplate -> created');
        return result.LaunchTemplate?.LaunchTemplateId;
    }
};

const getExistingTargetGroupArns = async (elbV2Client, loadBalancerArn) => {
    // Check if Target Group exists
    let result = await elbV2Client.send(
        new DescribeTargetGroupsCommand({
            LoadBalancerArn: loadBalancerArn,
        })
    );
    return result?.TargetGroups?.map((group) => group.TargetGroupArn) || [];
};

const createTargetGroup = async (elbV2Client, targetGroupParams, vpcId) => {
    const result = await elbV2Client.send(
        new CreateTargetGroupCommand({
            Name: targetGroupParams.name,
            Protocol: targetGroupParams.protocol,
            Port: targetGroupParams.port,
            VpcId: vpcId,
            TargetType: targetGroupParams.targetType,
            HealthCheckProtocol: targetGroupParams.healthCheckProtocol,
            HealthCheckPort: targetGroupParams.healthCheckPort,
            HealthCheckPath: targetGroupParams.healthCheckPath,
        })
    );
    console.log('EC2 -> createTargetGroup -> created');
    return result.TargetGroups[0].TargetGroupArn;
};

const moveTargetsToNewTargetGroup = async (elbV2Client, oldTargetGroupArns, newTargetGroupArn) => {
    if (!oldTargetGroupArns?.length) {
        console.log('EC2 -> moveTargetsToNewTargetGroup -> no targets to move');
    }
    for (const arn of oldTargetGroupArns) {
        console.log('EC2 -> moveTargetsToNewTargetGroup -> arn:', arn);
        const targetsResult = await elbV2Client.send(
            new DescribeTargetHealthCommand({
                TargetGroupArn: arn,
                Include: ['All'],
            })
        );
        const targets = targetsResult.TargetHealthDescriptions.map((description) => ({
            Id: description.Target.Id,
        }));
        console.log('EC2 -> moveTargetsToNewTargetGroup -> targets:', targets);
        if (!targets.length) {
            console.log('EC2 -> moveTargetsToNewTargetGroup -> no targets to move');
            continue;
        }
        await elbV2Client.send(
            new DeregisterTargetsCommand({
                TargetGroupArn: arn,
                Targets: targets,
            })
        );
        console.log('EC2 -> moveTargetsToNewTargetGroup -> deregistered');
        await elbV2Client.send(
            new RegisterTargetsCommand({
                TargetGroupArn: newTargetGroupArn,
                Targets: targets,
            })
        );
        console.log('EC2 -> moveTargetsToNewTargetGroup -> registered');
    }
    console.log('EC2 -> moveTargetsToNewTargetGroup -> moved');
};

const removeTargetGroups = async (elbV2Client, targetGroupArns) => {
    if (!targetGroupArns?.length) {
        console.log('EC2 -> removeTargetGroups -> no target groups to remove');
    }
    for (const arn of targetGroupArns) {
        await elbV2Client.send(
            new DeleteTargetGroupCommand({
                TargetGroupArn: arn,
            })
        );
    }
    console.log('EC2 -> removeTargetGroups -> removed');
};

const getLoadBalancer = async (elbV2Client, loadBalancerParams) => {
    let result = await elbV2Client
        .send(
            new DescribeLoadBalancersCommand({
                Names: [loadBalancerParams.name],
            })
        )
        .catch((err) => {
            if (err.name === 'LoadBalancerNotFoundException') {
                return null;
            } else {
                throw err;
            }
        });
    return result?.LoadBalancers?.[0]?.LoadBalancerArn;
};

const createLoadBalancer = async (elbV2Client, loadBalancerParams, targetGroupParams, ec2SecurityGroupId, targetGroupArn) => {
    // Check Load Balancer exists
    let result = await elbV2Client
        .send(
            new DescribeLoadBalancersCommand({
                Names: [loadBalancerParams.name],
            })
        )
        .catch((err) => {
            if (err.name === 'LoadBalancerNotFoundException') {
                return null;
            } else {
                throw err;
            }
        });

    if (result?.LoadBalancers?.length > 0) {
        // Name, Type, Scheme, IpAddressType can't be updated
        // TODO: need to create new load balancer in this case ???

        // Update Security Groups and Subnets
        await elbV2Client.send(
            new SetSecurityGroupsCommand({
                LoadBalancerArn: result.LoadBalancers[0].LoadBalancerArn,
                SecurityGroups: [ec2SecurityGroupId],
            })
        );
        await elbV2Client.send(
            new SetSubnetsCommand({
                LoadBalancerArn: result.LoadBalancers[0].LoadBalancerArn,
                Subnets: loadBalancerParams.subnets,
            })
        );
        console.log('EC2 -> createLoadBalancer -> updated');

        // Remove ALL Listeners
        const listenersResult = await elbV2Client.send(
            new DescribeListenersCommand({
                LoadBalancerArn: result.LoadBalancers[0].LoadBalancerArn,
            })
        );
        for (const listener of listenersResult.Listeners) {
            await elbV2Client.send(
                new DeleteListenerCommand({
                    ListenerArn: listener.ListenerArn,
                })
            );
        }
        console.log('EC2 -> createLoadBalancer -> listeners removed');
    } else {
        // Create Load Balancer
        result = await elbV2Client.send(
            new CreateLoadBalancerCommand({
                Name: loadBalancerParams.name,
                Type: loadBalancerParams.type,
                Scheme: loadBalancerParams.scheme,
                IpAddressType: loadBalancerParams.ipAddressType,
                SecurityGroups: [ec2SecurityGroupId],
                Subnets: loadBalancerParams.subnets,
            })
        );
        console.log('EC2 -> createLoadBalancer -> created');
    }

    // Add Listener
    await elbV2Client.send(
        new CreateListenerCommand({
            LoadBalancerArn: result.LoadBalancers[0].LoadBalancerArn,
            Protocol: targetGroupParams.protocol,
            Port: targetGroupParams.listenerPort || targetGroupParams.port,
            DefaultActions: [
                {
                    Type: 'forward',
                    TargetGroupArn: targetGroupArn,
                },
            ],
        })
    );
    console.log('EC2 -> createLoadBalancer -> listeners added');

    return result.LoadBalancers[0].LoadBalancerArn;
};

const createAutoScalingGroup = async (
    autoScalingClient,
    autoScalingGroupParams,
    launchTemplateId,
    targetGroupArn,
    existingTargetGroupArns
) => {
    const params = {
        AutoScalingGroupName: autoScalingGroupParams.name,
        LaunchTemplate: {
            LaunchTemplateId: launchTemplateId,
            Version: '$Latest',
        },
        MinSize: autoScalingGroupParams.minSize,
        MaxSize: autoScalingGroupParams.maxSize,
        DesiredCapacity: autoScalingGroupParams.desiredCapacity,
        VPCZoneIdentifier: autoScalingGroupParams.subnets.join(),
        HealthCheckType: autoScalingGroupParams.healthCheckType,
        HealthCheckGracePeriod: autoScalingGroupParams.healthCheckGracePeriod,
    };

    // Check Auto Scaling Group exists
    const result = await autoScalingClient.send(
        new DescribeAutoScalingGroupsCommand({
            AutoScalingGroupNames: [autoScalingGroupParams.name],
        })
    );

    if (result.AutoScalingGroups?.length > 0) {
        // Update Auto Scaling Group
        await autoScalingClient.send(new UpdateAutoScalingGroupCommand(params));
        // Attach new Target Group
        await autoScalingClient.send(
            new AttachLoadBalancerTargetGroupsCommand({
                AutoScalingGroupName: params.AutoScalingGroupName,
                TargetGroupARNs: [targetGroupArn],
            })
        );
        // Detach old target groups
        if (existingTargetGroupArns?.length) {
            await autoScalingClient.send(
                new DetachLoadBalancerTargetGroupsCommand({
                    AutoScalingGroupName: params.AutoScalingGroupName,
                    TargetGroupARNs: existingTargetGroupArns,
                })
            );
        }
        console.log('EC2 -> createAutoScalingGroup -> updated');
    } else {
        // Create Auto Scaling Group
        params.TargetGroupARNs = [targetGroupArn];
        await autoScalingClient.send(new CreateAutoScalingGroupCommand(params));
        console.log('EC2 -> createAutoScalingGroup -> created');
    }
};
