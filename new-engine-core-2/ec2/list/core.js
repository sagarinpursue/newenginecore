import { randomBytes } from 'crypto';

export default (config) => {
    const vpc = config.aws.vpc.core;
    const rdsCluster = config.aws.rds.cluster.core;
    const ec2Name = config.aws.ec2.core;
    const roleName = config.aws.iam.role.ec2Core;
    const bucketName = config.aws.s3.core.name;

    return {
        name: ec2Name,
        vpc,
        securityGroup: {
            ec2Instance: {
                name: `${ec2Name}-ec2-instance`,
                description: `Security group for ${ec2Name} EC2 instance`,
                inboundRules: [
                    {
                        protocol: 'tcp',
                        fromPort: 8000,
                        toPort: 8000,
                        cidrIp: '0.0.0.0/0',
                        description: 'Access to Instance',
                    },
                    {
                        protocol: 'tcp',
                        fromPort: 80,
                        toPort: 80,
                        cidrIp: '0.0.0.0/0',
                        description: 'Access to Load Balancer',
                    },
                ],
                outboundRules: [],
            },
            rdsCluster: {
                name: `${ec2Name}-rds-cluster`,
                description: `Security group for ${ec2Name} RDS cluster`,
                inboundRules: [],
                outboundRules: [],
            },
        },
        launchTemplate: {
            name: ec2Name,
            keyPair: 'core',
            instanceType: 't3.small',
            ami: {
                name: 'ubuntu/images/hvm-ssd/ubuntu-*-22.04-amd64-server-*',
                architecture: 'x86_64',
                virtualization: 'hvm',
                owner: '099720109477', // Canonical AWS account
            },
            instanceProfileName: ec2Name,
            roleName,
            volumeSize: 16,
            subnets: vpc.subnets.tier1,
            userData: `#!/bin/bash
                echo "Install AWS CLI and Docker"
                sudo apt-get update
                sudo apt-get install apt-transport-https ca-certificates curl software-properties-common -y
                curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
                echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
                sudo apt-get update
                sudo apt-get install awscli docker-ce docker-ce-cli containerd.io -y
                sudo aws --version
                sudo docker --version

                echo "Create separate directory in home directory"
                cd /home/ubuntu
                mkdir -p db-api
                cd db-api
                
                echo "Download DB API config"
                aws s3 cp "s3://${bucketName}/db-api-config/docker-compose.yml" "docker-compose.yml"
                aws s3 cp "s3://${bucketName}/db-api-config/.env" ".env"
                aws s3 cp "s3://${bucketName}/db-api-config/volumes" "volumes" --recursive
                
                echo "Pull DB API image"
                sudo docker compose pull

                echo "Run DB API"
                sudo docker compose up -d`,
        },
        loadBalancer: {
            name: ec2Name,
            type: 'application',
            scheme: 'internet-facing',
            ipAddressType: 'ipv4',
            subnets: vpc.subnets.tier1,
        },
        targetGroup: {
            // Random is needed because deployment script work as below:
            // 1. Create new target group
            // 2. Move targets to new target group
            // 3. Remove old target group
            name: `${ec2Name}-${generateRandomString(8)}`,

            protocol: 'HTTP',
            listenerPort: 80,
            port: 8000,
            targetType: 'instance',
            healthCheckProtocol: 'HTTP',
            healthCheckPort: 8000,
            healthCheckPath: '/storage/v1/status',
        },
        autoScalingGroup: {
            name: ec2Name,
            minSize: 2,
            maxSize: 5,
            desiredCapacity: 2,
            healthCheckType: 'ELB',
            healthCheckGracePeriod: 300,
            subnets: vpc.subnets.tier1,
        },
        rdsCluster,
    };
};

function generateRandomString(length) {
    return randomBytes(length).toString('hex').slice(0, length);
}
