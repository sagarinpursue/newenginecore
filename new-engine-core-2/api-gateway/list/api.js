export default (config) => {
    const appName = config.appName;
    const environment = config.environment;
    const apiName = config.aws.apiGateway.api?.name;
    const stageName = config.aws.apiGateway.api?.stage;
    const region = config.aws.region;
    const accountId = config.aws.accountId;
    const invokeLambdaRole = config.aws.iam.role.apiGatewayInvokeLambda;
    return {
        name: apiName,
        description: 'Api for UI',
        types: ['REGIONAL'],
        stage: stageName,
        paths: {
            // Auth (Core Module)
            token: {
                post: {
                    // POST/token
                    lambda: config.aws.lambda.dbApiInvoker,
                    proxy: true,
                },
            },
            'reset-password': {
                post: {
                    // POST/reset-password
                    lambda: config.aws.lambda.dbApiInvoker,
                    proxy: true,
                },
            },
            // TODO: add to clft
            invite: {
                post: {
                    lambda: config.aws.lambda.dbApiInvoker,
                    auth: ['JwtTokenAuthorizer'],
                    proxy: true,
                },
            },

            // Accounts/Users (Core Module)
            'account/list': {
                get: {
                    // GET/account/list
                    lambda: config.aws.lambda.dbApiInvoker,
                    auth: ['JwtTokenAuthorizer'],
                    proxy: true,
                },
            },
            user: {
                get: {
                    // GET/user
                    lambda: config.aws.lambda.dbApiInvoker,
                    auth: ['JwtTokenAuthorizer'],
                    proxy: true,
                },
                put: {
                    // PUT/user
                    lambda: config.aws.lambda.dbApiInvoker,
                    auth: ['JwtTokenAuthorizer'],
                    proxy: true,
                },
                patch: {
                    // PATCH/user
                    lambda: config.aws.lambda.dbApiInvoker,
                    auth: ['JwtTokenAuthorizer'],
                    proxy: true,
                },
                post: {
                    lambda: config.aws.lambda.userPost,
                    auth: ['JwtTokenAuthorizer'],
                    proxy: true,
                },
                delete: {
                    lambda: config.aws.lambda.userDelete,
                    auth: ['JwtTokenAuthorizer'],
                    proxy: true,
                },
            },

            // General
            search: {
                post: {
                    lambda: config.aws.lambda.searchPost,
                    auth: ['JwtTokenAuthorizer'],
                    proxy: true,
                },
            },

            // KPI
            'entity/list/statistics': {
                post: {
                    // POST/entity/list/statistics
                    lambda: config.aws.lambda.dbApiInvoker,
                    auth: ['JwtTokenAuthorizer'],
                    proxy: true,
                },
            },
            'service/list': {
                get: {
                    // GET/service/list
                    lambda: config.aws.lambda.dbApiInvoker,
                    auth: ['JwtTokenAuthorizer'],
                    proxy: true,
                },
            },
            'service/list/statistics': {
                post: {
                    // POST/service/list/statistics
                    lambda: config.aws.lambda.dbApiInvoker,
                    auth: ['JwtTokenAuthorizer'],
                    proxy: true,
                },
            },
            'order/list/statistics': {
                post: {
                    // POST/order/list/statistics
                    lambda: config.aws.lambda.dbApiInvoker,
                    auth: ['JwtTokenAuthorizer'],
                    proxy: true,
                },
            },
            order: {
                post: {
                    // POST/order
                    lambda: config.aws.lambda.dbApiInvoker,
                    auth: ['JwtTokenAuthorizer'],
                    proxy: true,
                },
            },
            'account/list/without-report': {
                get: {
                    // GET/report/list
                    lambda: config.aws.lambda.dbApiInvoker,
                    auth: ['JwtTokenAuthorizer'],
                    proxy: true,
                },
            },
            'report/list': {
                get: {
                    // GET/report/list
                    lambda: config.aws.lambda.dbApiInvoker,
                    auth: ['JwtTokenAuthorizer'],
                    proxy: true,
                },
            },
            report: {
                post: {
                    // POST/report
                    lambda: config.aws.lambda.dbApiInvoker,
                    auth: ['JwtTokenAuthorizer'],
                    proxy: true,
                },
            },
            'send/notification': {
                post: {
                    // POST/send/notification
                    lambda: config.aws.lambda.kpiSendEmailPost,
                    auth: ['JwtTokenAuthorizer'],
                    proxy: true,
                },
            },

            // LLM (GA Module)
            'llm-data-source': {
                delete: {
                    // DELETE/llm-data-source
                    lambda: config.aws.lambda.llmDataSourceDelete,
                    auth: ['JwtTokenAuthorizer'],
                    proxy: true,
                },
                get: {
                    // GET/llm-data-source
                    lambda: config.aws.lambda.dbApiInvoker,
                    auth: ['JwtTokenAuthorizer'],
                    proxy: true,
                },
                patch: {
                    // PATCH/llm-data-source
                    lambda: config.aws.lambda.dbApiInvoker,
                    auth: ['JwtTokenAuthorizer'],
                    proxy: true,
                },
                post: {
                    // POST/llm-data-source
                    lambda: config.aws.lambda.llmDataSourcePost,
                    auth: ['JwtTokenAuthorizer'],
                    proxy: true,
                },
            },
            'llm-data-source/sync': {
                post: {
                    // POST/llm-data-source/sync
                    lambda: config.aws.lambda.awsInvoker,
                    auth: ['JwtTokenAuthorizer'],
                    proxy: true,
                },
            },
            'llm-data-source/sync/status': {
                get: {
                    // GET/llm-data-source/sync/status
                    lambda: config.aws.lambda.awsInvoker,
                    auth: ['JwtTokenAuthorizer'],
                    proxy: true,
                },
            },
            'llm-rule': {
                delete: {
                    // DELETE/llm-rule
                    lambda: config.aws.lambda.dbApiInvoker,
                    auth: ['JwtTokenAuthorizer'],
                    proxy: true,
                },
                get: {
                    // GET/llm-rule
                    lambda: config.aws.lambda.dbApiInvoker,
                    auth: ['JwtTokenAuthorizer'],
                    proxy: true,
                },
                patch: {
                    // PATCH/llm-rule
                    lambda: config.aws.lambda.dbApiInvoker,
                    auth: ['JwtTokenAuthorizer'],
                    proxy: true,
                },
                post: {
                    // POST/llm-rule
                    lambda: config.aws.lambda.dbApiInvoker,
                    auth: ['JwtTokenAuthorizer'],
                    proxy: true,
                },
            },
            'llm-structure': {
                delete: {
                    // DELETE/llm-structure
                    lambda: config.aws.lambda.dbApiInvoker,
                    auth: ['JwtTokenAuthorizer'],
                    proxy: true,
                },
                get: {
                    // GET/llm-structure
                    lambda: config.aws.lambda.dbApiInvoker,
                    auth: ['JwtTokenAuthorizer'],
                    proxy: true,
                },
                post: {
                    // POST/llm-structure
                    lambda: config.aws.lambda.llmStructurePost,
                    auth: ['JwtTokenAuthorizer'],
                    proxy: true,
                },
            },
            'llm-structure/model/list': {
                get: {
                    // GET/llm-structure/model/list
                    lambda: config.aws.lambda.llmStructureModelListGet,
                    auth: ['JwtTokenAuthorizer'],
                    proxy: true,
                },
            },
            'llm-structure/shared-token': {
                get: {
                    // GET/llm-structure/shared-token
                    lambda: config.aws.lambda.dbApiInvoker,
                    auth: ['JwtTokenAuthorizer'],
                    proxy: true,
                },
                delete: {
                    // DELETE/llm-structure/shared-token
                    lambda: config.aws.lambda.dbApiInvoker,
                    auth: ['JwtTokenAuthorizer'],
                    proxy: true,
                },
                patch: {
                    // PATCH/llm-structure/shared-token
                    lambda: config.aws.lambda.dbApiInvoker,
                    auth: ['JwtTokenAuthorizer'],
                    proxy: true,
                },
                post: {
                    // POST/llm-structure/shared-token
                    lambda: config.aws.lambda.dbApiInvoker,
                    auth: ['JwtTokenAuthorizer'],
                    proxy: true,
                },
            },
            'llm-structure/processing': {
                post: {
                    // POST/shared/llm-structure/processing
                    lambda: config.aws.lambda.llmStructureProcessingPost,
                    auth: ['JwtTokenAuthorizer'],
                    proxy: true,
                },
            },
            'shared/llm-structure/processing': {
                post: {
                    // POST/llm-structure/processing
                    lambda: config.aws.lambda.llmStructureProcessingPost,
                    auth: ['SharedTokenAuthorizer', 'ApiKey'],
                    proxy: true,
                },
            },

            // Chat Bot (CX Module)
            // done
            'public/web-integration': {
                post: {
                    // POST/public/web-integration
                    lambda: config.aws.lambda.webIntegration,
                    auth: ['ApiKey'],
                    proxy: true,
                },
            },
            // done
            'public/messages-poll': {
                get: {
                    // GET/public/messages-poll
                    lambda: config.aws.lambda.clientMessagePoller,
                    auth: ['ApiKey'],
                    proxy: true,
                },
            },
            // done
            'cx/connect-instances/list': {
                get: {
                    lambda: config.aws.lambda.connectInstanceListIntegration,
                    auth: ['JwtTokenAuthorizer'],
                    proxy: true,
                },
            },
            'cx/channel': {
                get: {
                    lambda: config.aws.lambda.dbApiInvoker,
                    auth: ['JwtTokenAuthorizer'],
                    proxy: true,
                },
                post: {
                    lambda: config.aws.lambda.cxChannelPost,
                    auth: ['JwtTokenAuthorizer'],
                    proxy: true,
                },
                delete: {
                    lambda: config.aws.lambda.cxChannelDelete,
                    auth: ['JwtTokenAuthorizer'],
                    proxy: true,
                },
            },
            // TODO: add to clft
            'cx/dashboard/metrics': {
                get: {
                    lambda: config.aws.lambda.dbApiInvoker,
                    auth: ['JwtTokenAuthorizer'],
                    proxy: true,
                },
            },
            'cx/dashboard/period-summary': {
                get: {
                    lambda: config.aws.lambda.dbApiInvoker,
                    auth: ['JwtTokenAuthorizer'],
                    proxy: true,
                },
            },
            'cx/chat': {
                get: {
                    lambda: config.aws.lambda.dbApiInvoker,
                    auth: ['JwtTokenAuthorizer'],
                    proxy: true,
                },
                post: {
                    lambda: config.aws.lambda.dbApiInvoker,
                    auth: ['JwtTokenAuthorizer'],
                    proxy: true,
                },
                patch: {
                    lambda: config.aws.lambda.dbApiInvoker,
                    auth: ['JwtTokenAuthorizer'],
                    proxy: true,
                },
                delete: {
                    lambda: config.aws.lambda.dbApiInvoker,
                    auth: ['JwtTokenAuthorizer'],
                    proxy: true,
                },
            },
            'cx/ai-agent': {
                get: {
                    lambda: config.aws.lambda.cxAiAgentGet,
                    auth: ['JwtTokenAuthorizer'],
                    proxy: true,
                },
                post: {
                    lambda: config.aws.lambda.cxAiAgentPost,
                    auth: ['JwtTokenAuthorizer'],
                    proxy: true,
                },
                put: {
                    lambda: config.aws.lambda.cxAiAgentPut,
                    auth: ['JwtTokenAuthorizer'],
                    proxy: true,
                },
            },
            // done
            'cx/ai-agents': {
                get: {
                    lambda: config.aws.lambda.awsInvoker,
                    auth: ['JwtTokenAuthorizer'],
                    proxy: true,
                },
            },
            // done
            'cx/ai-agents/action-groups': {
                get: {
                    lambda: config.aws.lambda.awsInvoker,
                    auth: ['JwtTokenAuthorizer'],
                    proxy: true,
                },
                post: {
                    lambda: config.aws.lambda.awsInvoker,
                    auth: ['JwtTokenAuthorizer'],
                    proxy: true,
                },
                put: {
                    lambda: config.aws.lambda.awsInvoker,
                    auth: ['JwtTokenAuthorizer'],
                    proxy: true,
                },
                delete: {
                    lambda: config.aws.lambda.awsInvoker,
                    auth: ['JwtTokenAuthorizer'],
                    proxy: true,
                },
            },
            // done
            'cx/ai-agents/action-groups/list': {
                get: {
                    lambda: config.aws.lambda.awsInvoker,
                    auth: ['JwtTokenAuthorizer'],
                    proxy: true,
                },
            },
            // done
            'webhook/live-chat': {
                post: {
                    // POST/webhook/live-chat
                    lambda: config.aws.lambda.webhookLiveChat,
                },
            },
            'cx/ai-agents/collaborator/list': {
                get: {
                    lambda: config.aws.lambda.awsInvoker,
                    auth: ['JwtTokenAuthorizer'],
                    proxy: true,
                },
            },
            'cx/ai-agents/collaborator': {
                post: {
                    lambda: config.aws.lambda.awsInvoker,
                    auth: ['JwtTokenAuthorizer'],
                    proxy: true,
                },
                put: {
                    lambda: config.aws.lambda.awsInvoker,
                    auth: ['JwtTokenAuthorizer'],
                    proxy: true,
                },
                delete: {
                    lambda: config.aws.lambda.awsInvoker,
                    auth: ['JwtTokenAuthorizer'],
                    proxy: true,
                },
            },
            'cx/ai-agents/knowledge-base': {
                post: {
                    lambda: config.aws.lambda.awsInvoker,
                    auth: ['JwtTokenAuthorizer'],
                    proxy: true,
                },
                put: {
                    lambda: config.aws.lambda.awsInvoker,
                    auth: ['JwtTokenAuthorizer'],
                    proxy: true,
                },
                delete: {
                    lambda: config.aws.lambda.awsInvoker,
                    auth: ['JwtTokenAuthorizer'],
                    proxy: true,
                },
            },
            'cx/ai-agents/knowledge-base/list': {
                get: {
                    lambda: config.aws.lambda.awsInvoker,
                    auth: ['JwtTokenAuthorizer'],
                    proxy: true,
                },
            },
            // done
            'public/chat_messages/rating': {
                post: {
                    lambda: config.aws.lambda.dbApiInvoker,
                    auth: ['ApiKey'],
                    proxy: true,
                },
                patch: {
                    lambda: config.aws.lambda.dbApiInvoker,
                    auth: ['ApiKey'],
                    proxy: true,
                },
                delete: {
                    lambda: config.aws.lambda.dbApiInvoker,
                    auth: ['ApiKey'],
                    proxy: true,
                },
            },
            'public/session': {
                post: {
                    lambda: config.aws.lambda.cxChatSessionCreator,
                    auth: ['ApiKey'],
                    proxy: true,
                },
            },
            // done
            'public/chat_messages/feedback': {
                post: {
                    lambda: config.aws.lambda.dbApiInvoker,
                    auth: ['ApiKey'],
                    proxy: true,
                },
            },
            // done
            'public/chat_sessions/rating': {
                post: {
                    lambda: config.aws.lambda.dbApiInvoker,
                    auth: ['ApiKey'],
                    proxy: true,
                },
            },
            // done
            'public/chat_sessions/feedback': {
                post: {
                    lambda: config.aws.lambda.dbApiInvoker,
                    auth: ['ApiKey'],
                    proxy: true,
                },
            },
            // done
            'public/chat_messages/report': {
                post: {
                    lambda: config.aws.lambda.dbApiInvoker,
                    auth: ['ApiKey'],
                    proxy: true,
                },
            },
            // TODO: add to clft
            'public/chat-sessions': {
                post: {
                    lambda: config.aws.lambda.dbApiInvoker,
                    auth: ['ApiKey'],
                    proxy: true,
                },
            },
            // CMS
            // done
            'cms/analysis-reports/generate-document-questions': {
                post: {
                    lambda: config.aws.lambda.cmsDocumentQuestionGenerator,
                    auth: ['JwtTokenAuthorizer'],
                    proxy: true,
                },
            },
            // done
            'cms/analysis-reports/detect-issue-chunks': {
                post: {
                    lambda: config.aws.lambda.cmsChunkDuplicateConflictDetector,
                    auth: ['JwtTokenAuthorizer'],
                    proxy: true,
                },
            },
            // done
            'cms/documents/generate-pre-signed-urls': {
                post: {
                    lambda: config.aws.lambda.cmsDocumentGeneratePreSignedUrls,
                    auth: ['JwtTokenAuthorizer'],
                    proxy: true,
                },
            },
            // done
            'cms/documents/finish-uploading-files': {
                post: {
                    lambda: config.aws.lambda.cmsDocumentFinishUploadingFiles,
                    auth: ['JwtTokenAuthorizer'],
                    proxy: true,
                },
            },
            // done
            'cms/documents/list': {
                get: {
                    lambda: config.aws.lambda.cmsDocumentListGet,
                    auth: ['JwtTokenAuthorizer'],
                    proxy: true,
                },
            },
        },
        authorizers: {
            JwtTokenAuthorizer: {
                type: 'apiKey',
                name: 'Authorization',
                in: 'header',
                'x-amazon-apigateway-authtype': 'custom',
                'x-amazon-apigateway-authorizer': {
                    type: 'token',
                    authorizerUri: `arn:aws:apigateway:${region}:lambda:path/2015-03-31/functions/arn:aws:lambda:${region}:${accountId}:function:${config.aws.lambda.jwtTokenAuthorizer}/invocations`,
                    identitySource: 'method.request.header.Authorization',
                    authorizerCredentials: `arn:aws:iam::${accountId}:role/${invokeLambdaRole}`,
                    authorizerResultTtlInSeconds: 0,
                },
            },
            SharedTokenAuthorizer: {
                type: 'apiKey',
                name: 'X-Shared-Token', // TODO: alternatives: 'X-Resource-Access-Token', 'Authorization': 'Shared ...'
                in: 'header',
                'x-amazon-apigateway-authtype': 'custom',
                'x-amazon-apigateway-authorizer': {
                    type: 'token',
                    authorizerUri: `arn:aws:apigateway:${region}:lambda:path/2015-03-31/functions/arn:aws:lambda:${region}:${accountId}:function:${config.aws.lambda.sharedTokenAuthorizer}/invocations`,
                    identitySource: 'method.request.header.X-Shared-Token', // TODO: alternative 'X-Resource-Access-Token', 'Authorization': 'Shared ...'
                    authorizerCredentials: `arn:aws:iam::${accountId}:role/${invokeLambdaRole}`,
                    authorizerResultTtlInSeconds: 0,
                },
            },
            ApiKey: {
                type: 'apiKey',
                name: 'x-api-key',
                in: 'header',
            },
        },
        usagePlans: [
            {
                name: `${appName}-development-team-${environment}`,
                description: `Used by ${appName} development team in ${environment}`,
                throttle: { rateLimit: 10, burstLimit: 20 },
                quota: { limit: 1000, period: 'MONTH' },
            },
            {
                name: `${appName}-public-usage-plan-${environment}`,
                description: `Used by ${appName} for getting public access without jwt auth in ${environment}`,
                throttle: { rateLimit: 10, burstLimit: 20 },
            },
        ],
        apiKeys: [
            {
                name: `${appName}-development-team-${environment}`,
                usagePlanName: `${appName}-development-team-${environment}`,
            },
            {
                name: `${appName}-public-api-key-${environment}`,
                usagePlanName: `${appName}-public-usage-plan-${environment}`,
            },
        ],
    };
};
