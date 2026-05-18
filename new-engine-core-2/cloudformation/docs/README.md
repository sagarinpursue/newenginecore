# CloudFormation Templates Documentation

This document provides an index of the major sections within the CloudFormation templates.

## Core Templates

* [EC2 Template Resource Index](#ec2-template-resource-index)
* [RDS Template Resource Index](#rds-template-resource-index)
* [VPC Template Resource Index](#vpc-template-resource-index)
* [Web UI Template Resource Index](#web-ui-template-resource-index)
* [WAF Template Resource Index](#waf-template-resource-index)

## Module Templates

* [CX Template Resource Index](#cx-template-resource-index)
* [GA Template Resource Index](#ga-template-resource-index)
* [CMS Template Resource Index](#cms-template-resource-index)

<a name="ec2-template-resource-index"></a>
# EC2 Template Resource Index

This file indexes the major sections within the `templates/core/ec2.yaml` template, detailing the start and end lines for each.

| Section Name | Start Line | End Line |
|--------------|------------|----------|
| EC2 Key Pairs | 22 | 32 |
| IAM Roles | 35 | 49 |
| IAM Instance Profiles | 52 | 59 |
| EC2 Launch Templates | 62 | 108 |
| LB Target Groups | 111 | 128 |
| Auto Scaling Groups | 131 | 152 |
| EC2 Security Groups | 155 | 169 |
| Load Balancers | 172 | 189 |
| Load Balancer Listeners | 192 | 202 |
| Outputs | 205 | 211 |


<a name="rds-template-resource-index"></a>
# RDS Template Resource Index

This file indexes the major sections within the `templates/core/rds.yaml` template, detailing the start and end lines for each.

| Section Name | Start Line | End Line |
|--------------|------------|----------|
| RDS Aurora Cluster | 18 | 38 |
| RDS Aurora Instances | 41 | 48 |
| RDS Subnet Groups | 51 | 61 |
| RDS Security Groups | 64 | 80 |
| Outputs | 83 | 88 |


<a name="vpc-template-resource-index"></a>
# VPC Template Resource Index

This file indexes the major sections within the `templates/core/vpc.yaml` template, detailing the start and end lines for each.

| Section Name | Start Line | End Line |
|--------------|------------|----------|
| VPC | 23 | 34 |
| VPC Cidr Blocks | 37 | 44 |
| VPC Route Tables | 47 | 65 |
| VPC Internet Gateway | 68 | 92 |
| VPC Public Subnets | 95 | 140 |
| VPC Public RT Association | 143 | 164 |
| VPC Private Subnets | 167 | 209 |
| VPC Private RT Association | 212 | 233 |
| VPC Security Groups | 236 | 258 |
| Outputs | 261 | 290 |


<a name="web-ui-template-resource-index"></a>
# Web UI Template Resource Index

This file indexes the major sections within the `templates/core/web-ui.yaml` template, detailing the start and end lines for each.

| Section Name | Start Line | End Line |
|--------------|------------|----------|
| CloudFront OAC | 20 | 47 |
| S3 Bucket Policy | 50 | 85 |
| CloudFront Distributions | 88 | 190 |
| Outputs | 193 | 208 |


<a name="waf-template-resource-index"></a>
# WAF Template Resource Index

This file indexes the major sections within the `templates/core/waf.yaml` template, detailing the start and end lines for each.

| Section Name | Start Line | End Line |
|--------------|------------|----------|
| WAF WebACL | 12 | 61 |
| Outputs | 64 | 72 |


<a name="cx-template-resource-index"></a>
# CX Template Resource Index

This file indexes the major sections within the `templates/module/cx.yaml` template, detailing the start and end lines for each.

| Section Name | Start Line | End Line |
|--------------|------------|----------|
| Api Gateway Resources | 36 | 246 |
| WebIntegration Lambda | 249 | 316 |
| MessagesPoll Lambda | 319 | 387 |
| BotsListIntegration Lambda | 390 | 459 |
| DBProxy Lambda Attachments | 462 | 631 |
| WebhookLiveChat Lambda | 634 | 701 |
| ConnectInstancesListIntegration Lambda | 704 | 774 |
| AiAgentsListIntegration Lambda | 777 | 845 |
| AwsInvoker Lambda Attachments | 848 | 912 |
| AmazonConnectStreamListener Lambda | 915 | 960 |
| CronQueuePruner Lambda | 963 | 1015 |
| LexResponseProcessing Lambda | 1018 | 1061 |
| LiveAgentContactInitProcessing Lambda | 1064 | 1127 |
| RequestProcessing Lambda | 1130 | 1198 |
| ResponseProcessing Lambda | 1201 | 1249 |
| RotationLiveChatToken Lambda | 1252 | 1304 |
| Bedrock Agents Tracing Log Group | 1307 | 1312 |
| EventBridge Cron Queue Pruner Daily | 1315 | 1334 |
| Outputs | 1337 | 1356 |


<a name="ga-template-resource-index"></a>
# GA Template Resource Index

This file indexes the major sections within the `templates/modules/ga.yaml.yaml` template, detailing the start and end lines for each.

| Section Name | Start Line | End Line |
|--------------|------------|----------|
| Api Gateway Resources | 42 | 168 |
| LlmDataSourceDelete Lambda | 171 | 237 |
| LlmDataSourcePost Lambda | 240 | 317 |
| LlmStructureProcessingPost Lambda | 320 | 406 |
| LlmStructureNoFrameworkProcessing Lambda | 409 | 461 |
| Api Gateway Methods | 464 | 744 |
| Lambda Invoke Permissions | 747 | 907 |
| IAM Roles | 910 | 938 |
| OpenSearch Security Policies | 941 | 957 |
| OpenSearch Access Policy | 960 | 969 |
| OpenSearch Collection | 972 | 981 |
| Outputs | 984 | 1015 |


<a name="cms-template-resource-index"></a>
# CMS Template Resource Index

This file indexes the major sections within the `templates/modules/cms.yaml` template, detailing the start and end lines for each.

| Section Name | Start Line | End Line |
|--------------|------------|----------|
| CMS bucket | 21 | 27 |
| Api Gateway Resources | 30 | 58 |
| ChunkDuplicateConflictDetector Lambda | 61 | 125 |
| DocumentQuestionGenerator Lambda | 128 | 202 |