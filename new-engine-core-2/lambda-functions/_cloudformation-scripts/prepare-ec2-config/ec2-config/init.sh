#!/bin/bash
set -e
# TODO: This step was execute in AMI build
# echo 1. Install utilities and dependencies
# sudo apt-get update

# sudo apt-get install apt-transport-https ca-certificates curl software-properties-common -y
# curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
# echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
# sudo apt-get update

# sudo apt-get install -y \
#     jq \
#     docker-ce \
#     docker-ce-cli \
#     containerd.io

echo 2. Set Environment Variables from AWS Secrets Manager
MASTER_CREDENTIALS_DATA=$(
    aws secretsmanager get-secret-value \
    --secret-id $MASTER_CREDENTIALS_SECRET_ARN \
    --query SecretString \
    --output text
)
export POSTGRES_USER=$(jq -r .username  <<< "$MASTER_CREDENTIALS_DATA")
export POSTGRES_PASSWORD=$(jq -r .password  <<< "$MASTER_CREDENTIALS_DATA")

ADMIN_DASHBOARD_CREDENTIALS_DATA=$(
    aws secretsmanager get-secret-value \
    --secret-id $DASHBOARD_CREDENTIALS_SECRET_ARN \
    --query SecretString \
    --output text
)
export DASHBOARD_USERNAME=$(jq -r .username  <<< "$ADMIN_DASHBOARD_CREDENTIALS_DATA")
export DASHBOARD_PASSWORD=$(jq -r .password  <<< "$ADMIN_DASHBOARD_CREDENTIALS_DATA")

JWT_SECRET_DATA=$(
    aws secretsmanager get-secret-value \
    --secret-id $JWT_SECRET_ARN \
    --query SecretString \
    --output text
)
export JWT_SECRET=$(jq -r .jwtSecret  <<< "$JWT_SECRET_DATA")
export ANON_KEY=$(jq -r .anonKey  <<< "$JWT_SECRET_DATA")
export SERVICE_ROLE_KEY=$(jq -r .serviceRoleKey  <<< "$JWT_SECRET_DATA")
export SECRET_KEY_BASE=$(jq -r .secretKeyBase  <<< "$JWT_SECRET_DATA")

echo 3. Create environment file
envsubst < ./.env.tpl > ./.env

echo Pull and start dockers services
sudo docker compose up -d
