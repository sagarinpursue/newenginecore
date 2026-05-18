# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Breaking Changes

### Added

### Changed

### Removed

### Fixed

## [1.2.1] - 2026-04-29

### Added
- [Portal] Reload button and Search field for AI Agents, Chats and Channels
- [Portal] Ability to create `WhatsApp (360Dialog)` channel with webhook auth support
- [Portal] `WhatsApp Delivery Report` in CX Reports with `Delivery Overview` tiles, `Failed Deliveries Details` table and export for both
- [Portal] Display `WhatsApp Number` and `WhatsApp Business ID` in channel details for WhatsApp 360Dialog channel
- [Portal] Display `WhatsApp Number` at channel tile of WhatsApp 360Dialog channel
- [Backend] `vendor_id` and `vendor_label` columns with index by `vector_id` to `channels` table
- [Backend] `vendor_type` and `vendor_client_id` columns with index by `channel_id`, `vendor_client_id`, and `last_activity DESC` to `chatbot_sessions` table
- [Backend] New `cx_360dialog_statuses` table with 4 indexes to store statuses received from 360Dialog
- [Backend] `vendor_message_id` column with index by `vendor_message_id` and `source = 'ai-agent'` to `chat_messages` table
- [Backend] `get_cx_vendor_config` rpc function to get configuration by `vendor_id` instead of `channel_id`
- [Backend] `cx_dashboard_360_statuses_group_get` rpc function to get data for `Delivery Overview` tiles
- [Backend] `GET /cx/dashboard/360-statuses` route to invoke `cx_dashboard_360_statuses_group_get` rpc function via DB Proxy lambda
- [Backend] `cx_report_failed_deliveries_get` and `cx_report_failed_deliveries_total_items_get` rpc functions to show `Failed Deliveries Details` table with access via `search-post` lambda
- [Backend] Sending messages and typing indicator to WhatsApp clients via 360Dialog provider
- [Backend] Removing channel related secrets in case of removing channel itself
- [Backend] New `cx-webhook-360dialog` lambda to handle messages and statuses from 360Dialog provider with supporting `Authorization` header check
- [Backend] `POST /webhook/360dialog` route for `cx-webhook-360dialog` lambda
- [Backend] Support of WhatsApp text and reaction types of messages, where reactions integrated with thumbs up/down logic and `Evaluation Report` in CX Reports

### Changed
- [Portal] Show `URL` and `Distribution ID` fields at Channel Details page for `Web` channel only
- [Portal] `Channel` field in channel popup renamed into `Type`
- [Backend] Removing of extra `space` and `newline` symbols in AI response placed in `cx-response-processing` lambda instead of expecting it on client side
- [Backend] Name of `cx-request-processing` lambda provided dynamically via environment variables
- [Backend] Split role for `cx-channel-post` and `cx-channel-delete` lambdas
- [Backend] Replaced calling of `cx-response-processing` lambda with using `response-processing` utils in webhooks for both supported types of live agent
- [Backend] Replaced using `ListObjectVersionsCommand` with `ListObjectsV2Command` while removing channel related folder on S3
- [Backend] Allow to change vendor related data while channel updating, not linked chat only
- [Backend] Checking and creation of a session moved to integration level lambdas out of `cx-request-processing` lambda

## [1.1.23] - 2026-04-14

### Added
- [Portal] Date range picker at CX > Chat > Sessions page
- [Portal] Read-only field with logged user email at Profile page
- [Portal] Labels for tables in CX Reports
- [Portal] 3-dot menu with the 'Edit' item for AI Agents
- [Portal] Ability to set name for AI Agent while Import

### Changed
- [Backend] CMS module now disabled by default
- [Backend] Get `agentName` of AI Agent from DB instead of retrieving from AWS Bedrock
- [Backend] Handling of requests for action groups, knowledge bases and collaborators moved to `search-post` lambda instead of `aws-invoker`
- [Backend] Explicitly using `DRAFT` agent version in operations with action groups
- [Portal] In AI Agent Configuration displaying Collaborator Instruction instead of Agent ID and Version

### Removed
- [Backend] Validation of `resourceType` by enum in `search-post` lambda
- [Portal] Reload button and Search field at CX > Chat > Sessions page

### Fixed
- [Backend] Mistakenly added API key requirement for `POST /auth/forgot-password`
- [Backend] Failed migration for `connect_instances` database table
- [Portal] Search and pagination for Action Groups, Knowledge Bases and Collaborators in AI Agent Configuration

## [1.1.20] - 2026-04-07

### Breaking Changes
- [Backend] If environment has Data Source with `WEB` type created via platform, it needs to be recreated OR `customTransformationConfiguration` should be cleared manually via AWS Bedrock Console UI

### Added
- [Backend] Add a `prepare-local-run` script to `package.json` to simplify local development setup.
- [Backend] Create the `authAll` policy in `connect_instances` table, add `account_id` to `connect_instances` table
- [Backend] Masking PII in user's input messages except name, email and phone number
- [Backend] Chat summarization before switch to live agent(for LiveChat only)
- [Backend] `cx_channel_questions` table and `POST|PATCH|DELETE /cx/channel/question` routes to manipulate with predefined questions
- [Backend] `POST /auth/forgot-password`, `POST /auth/reset-password` routes and 2 lambdas for it, which changes flow for resetting a forgotten password
- [Portal] Auto refresh of the user table when user's added or updated
- [Portal] `Questions` section at CX Channel Details page with an ability to add/edit/delete predefined questions
- [Portal] `Active Sessions` tile to `Evaluation Report`, `Satisfaction Report`, and `Live Agent Report`
- [Portal] `Evaluated Sessions` tile (with % from active sessions) to `Evaluated Report`
- [Portal] % value from active sessions for `Transferred Sessions` tile

### Changed
- [Backend] Now `Admin` can be removed by `Super Admin`
- [Backend] Update `cx-connect-instance-list-integration` lambda function - add `schemas`, move DB Instance API to `_shared_modules`, check Authorization Token, append `instanceRegion` and `instanceCcpUrl` to response data.
- [Backend] Do not print file's binary into logs to control costs
- [Backend] Model's list now also filtered by `IMAGE` input modality
- [Backend] Set `was_escalated_to_live_agent` in case of successful connection only
- [Portal] Retrieve `CCP_URL` and `Region` from the CX Connect Instance API request
- [Portal] Phone number is optional in `Add New User` / `Edit User` forms of User Settings
- [Portal] User now can see `Edit` icon in Users Settings for himself
- [Portal] `Agent Transfer Sessions` tile in `Live Agent Report` renamed into `Transferred Sessions`
- [Portal] Skip filtering by hardcoded list of agent-optimized for list of models for AI Agent

### Removed
- [Backend] `llm-data-source-ingestion-transformation` lambda function

### Fixed
- [Backend] Issue with role check while user creation
- [Backend] Allow `0` value for `temperature` and `topP` parameters
- [Backend] Missed permissions for importing data source
- [Portal] Hide `Remove` icon for user itself
- [Portal] Show user's role in `Edit User` popup instead of default `User` role
- [Portal] Issue with retrieving connect instance details when the page reloads
- [Portal] Incorrect validation of `temperature` and `topP` fields of LLM Structure
- [Portal] Missed validation of `S3 Folder` field in Data Source popup
- [Portal] Show `Preamble` and `Assistant Appendix` fields even for `General Knowledge` structure type
- [Portal] Show `Top N` and `Use Hybrid Search` parameters for `RAG` structure type only
- [Portal] `Super Admin` role will not see `Remove` icon for any `Super Admin` role
- [Portal] Incorrect filtering of channels after selecting account at CX Dashboard and CX Reports pages

## [1.1.17] - 2026-03-17

### Added
- WebSocket server based on API Gateway with a cleaner for expired connections
- Table `websocket_connections` for storing WebSocket connections with DB API
- Create polling queue together with creating session while opening widget
- Enabled streaming for bedrock agent invocation and sending chunk over WebSocket
- Return `Date.now()` from `cx-web-integration` lambda to sync message timestamp
- New health check route for core instances

### Changed
- Polling returns `createdAt` field now
- Generation of response message id during in `cx-request-processing` lambda instead of getting from client side
- Minimal amount of core instances increased from 1 to 2
- Suppressed unused modules in core instance bundle
- Policies for `user_refs` database table more restrictive now
- Search results for `users` resource type contain `account_name` now
- `userAccountId` become required for user creation, added more restrictions
- `super_admin` role is being created during installation

### Fixed
- Incorrect health tracking of core instances
- Too open policies for `ai_agents`, `chats` and `channels` database tables
- User in `auth.users` is being removed now while `DELETE /user`

## [1.1.13] - 2026-02-18

### Added
- Use service role to access `chatbot_sessions` table from processing lambdas
- Pattern for data source name in validation
- Calculation of `active_session_time_max`, `active_session_time_min`, `active_session_time_p50`, and `active_session_time_p95` metrics
- Storing of `answered_at` for chat message and calculation of `total_ai_response_time_sum` and `total_ai_response_time_count` metrics
- `ACCOUNT_ID` environment variable and permissions to work with SQS to `cx-request-processing` lambda
- SQS queue with a lambda for question and response analysis, which is being requested in `cx-request-processing` after pushing response into polling queue
- new `chat_message_analysis` table and db-api for it
- `cx_report_failed_responses_get` and `cx_report_failed_responses_total_items_get` SQL functions for a table in a new `Failed Responses` report
- `cx_report_other_questions_get` and `cx_report_other_questions_total_items_get` SQL functions for the `Uncategorized Questions` table in a new `Keyword Frequency` report
- `cx_report_questions_categories_get` and `cx_report_questions_categories_total_items_get` SQL functions for the `Questions Categories` table in a new `Keyword Frequency` report

### Changed
- building `indexArn` and using it instead of `indexName` in `s3VectorsConfiguration`
- SQL function `cx_dashboard_metrics_get` optimized, renamed to `cx_dashboard_metrics_group_get`, added grouping by day and metric calculations for response analysis
- SQL function `cx_report_messages_with_issues_get` renamed to `cx_report_messages_feedbacks_get`, added `search_filter` support and returning account and channel names
- SQL function `cx_report_messages_with_issues_total_items_get` renamed to `cx_report_messages_feedbacks_total_items_get`, `search_filter` support added
- SQL function `cx_report_session_feedbacks_get` renamed to `cx_report_sessions_feedbacks_get`, added `search_filter` support and returning account and channel names
- SQL function `cx_report_session_feedbacks_total_items_get` renamed to `cx_report_sessions_feedbacks_total_items_get`, `search_filter` support added
- In `f2-cx-request-processing` lambda invocation of `f2-cx-response-processing` replaced with using `f2-utils`
- Skip validation and locale defining for `cx-request-processing` lambda
- `cx-request-processing` lambda always respond with `{ statusCode: 200 }`

### Fixed
- incorrect authorization for `POST /public/session`
- missed permission for `f2-cx-chat-session-creator` lambda in invocation policy
- missed adding columns in migration script for `chatbot_session` table
- duplications in the list of chatbot response sources
- using incorrect bucket name while removing S3 vector bucket
- missed vector bucket name for imported KnowledgeBases

## [1.1.11] - 2025-12-30

### Added
- Added `user-post` lambda function for user creation.
- Added `region` and `ccp_url` fields to the `connect_instances` table.
- Use `middy/secrets-manager` to fetch jwt auth from Secrets Manager
- Use service role to access `chat_messages` table from processing lambdas

### Changed
- Updated the `POST /user` API endpoint to use the new `user-post` Lambda function.
- Return Claude 3.7 Sonnet in models list at anyway.
- While building sources check `s3Location.uri`, not only `x-amz-bedrock-kb-source-uri`.
- Parse HTML file sources into a url without domain.

### Fixed
- Policies for `llm_log` table.
- Incorrect building of empty system prompt for LLM Structures

## [1.1.8] - 2025-12-17

### Added

- New actions for AwsInvokerLambdaRole
- New actions for BedrockAgentRole to access agent-alias.
- New files of migration.
- Support Invoke rpc function in search lambda.
- AJV validation for lambda llm-structure-model-list-get
- New lambda cx-chat-default-lambda-function-handler
- New action for lambda-functions aws-invoker

### Changed

- Updated resources in AWS Apigateway for CX Module.
- Renamed SQL function with get_cx_dashboard_metrics to cx_dashboard_metrics_get
- Updated AJV validation for lambda cx-ai-agent-post

### Removed

- Unused files and config parameters

### Fixed

- Fixed AiDataSourceCreatorLambda.
