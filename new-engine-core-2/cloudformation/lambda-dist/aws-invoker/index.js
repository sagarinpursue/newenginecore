// Native and 3rd party Node modules
import createError from 'http-errors';

import { BedrockClient } from '@aws-sdk/client-bedrock';
import { BedrockAgentClient } from '@aws-sdk/client-bedrock-agent';

import middy from '@middy/core';
import httpJsonBodyParser from '@middy/http-json-body-parser';
import inputOutputLogger from '@middy/input-output-logger';
import validator from '@middy/validator';

import Ajv from 'ajv';
import ajvErrors from 'ajv-errors';
import ajvFormats from 'ajv-formats';

import { httpResponseFormatter } from '@shared-modules/f2-middlewares';
import { httpErrorFormatter } from '@shared-modules/f2-middlewares';

import { cxAiAgentsActionGroupsDeleteQuerySchema } from './schemas/cx-ai-agents-action-groups-delete-query.js';
import { cxAiAgentsActionGroupsGetQuerySchema } from './schemas/cx-ai-agents-action-groups-get-query.js';
// import { cxAiAgentsActionGroupsListGetQuerySchema } from './schemas/cx-ai-agents-action-groups-list-get-query.js';
import { cxAiAgentsActionGroupsPostBodySchema } from './schemas/cx-ai-agents-action-groups-post-body.js';
import { cxAiAgentsActionGroupsPutBodySchema } from './schemas/cx-ai-agents-action-groups-put-body.js';
import { cxAiAgentsCollaboratorDeleteQuery } from './schemas/cx-ai-agents-collaborator-delete-query.js';
// import { cxAiAgentsCollaboratorListGetQuery } from './schemas/cx-ai-agents-collaborator-list-get-query.js';
import { cxAiAgentsCollaboratorPostBody } from './schemas/cx-ai-agents-collaborator-post-body.js';
import { cxAiAgentsCollaboratorPutBody } from './schemas/cx-ai-agents-collaborator-put-body.js';
import { cxAiAgentsGetQuery } from './schemas/cx-ai-agents-get-query.js';
import { cxAiAgentsKnowledgeBaseDeleteQuery } from './schemas/cx-ai-agents-knowledge-base-delete-query.js';
// import { cxAiAgentsKnowledgeBaseListGetQuery } from './schemas/cx-ai-agents-knowledge-base-list-get-query.js';
import { cxAiAgentsKnowledgeBasePostBody } from './schemas/cx-ai-agents-knowledge-base-post-body.js';
import { eventSchema } from './schemas/event.js';
import { llmDataSourceSyncPostBodySchema } from './schemas/llm-data-source-sync-post-body.js';
import { llmDataSourceSyncStatusGetQuerySchema } from './schemas/llm-data-source-sync-status-get-query.js';
import { llmStructureModelListGetQuerySchema } from './schemas/llm-structure-model-list-get-query.js';
import BedrockAgentService from './services/bedrock-agent-service.js';
import BedrockService from './services/bedrock-service.js';

// System env vars
const REGION = process.env.AWS_REGION;

// Custom env vars

// Create AJV instance and configure it with ajv-errors and ajv-formats
const ajv = new Ajv({ coerceTypes: 'number', strictTypes: false, allowUnionTypes: true, allErrors: true });
ajvFormats(ajv);
ajvErrors(ajv);

// Create Bedrock client instance
const bedrockClient = new BedrockClient({ region: REGION });

// Create Bedrock Agent client instance
const bedrockAgentClient = new BedrockAgentClient({ region: REGION });

export const handler = middy(async (event) => {
    const bedrockService = new BedrockService(bedrockClient);
    const bedrockAgentService = new BedrockAgentService(bedrockAgentClient);

    switch (event.httpMethod + event.path) {
        case `POST/llm-data-source/sync`: {
            if (!ajv.validate(llmDataSourceSyncPostBodySchema, event.body)) {
                console.error('validate body:', ajv.errors);
                const error = createError.BadRequest();
                error.cause = { data: ajv.errors };
                throw error;
            }
            return {
                data: await bedrockAgentService.sync(event.body),
            };
        }
        case `GET/llm-data-source/sync/status`: {
            if (!ajv.validate(llmDataSourceSyncStatusGetQuerySchema, event.queryStringParameters)) {
                console.error('validate query:', ajv.errors);
                const error = createError.BadRequest();
                error.cause = { data: ajv.errors };
                throw error;
            }
            return {
                data: await bedrockAgentService.getSyncStatus(event.queryStringParameters),
            };
        }
        case `GET/llm-structure/model/list`: {
            if (!ajv.validate(llmStructureModelListGetQuerySchema, event.queryStringParameters)) {
                console.error('validate query:', ajv.errors);
                const error = createError.BadRequest();
                error.cause = { data: ajv.errors };
                throw error;
            }
            return {
                data: await bedrockService.getModels(event.queryStringParameters),
            };
        }
        // case `GET/cx/ai-agents/action-groups/list`: {
        //     if (!ajv.validate(cxAiAgentsActionGroupsListGetQuerySchema, event.queryStringParameters)) {
        //         console.error('validate query:', ajv.errors);
        //         const error = createError.BadRequest();
        //         error.cause = { data: ajv.errors };
        //         throw error;
        //     }
        //     return {
        //         data: await bedrockAgentService.getListAgentActionGroups(event.queryStringParameters),
        //     };
        // }
        case `GET/cx/ai-agents/action-groups`: {
            if (!ajv.validate(cxAiAgentsActionGroupsGetQuerySchema, event.queryStringParameters)) {
                console.error('validate query:', ajv.errors);
                const error = createError.BadRequest();
                error.cause = { data: ajv.errors };
                throw error;
            }
            return {
                data: await bedrockAgentService.getAgentActionGroup(event.queryStringParameters),
            };
        }
        case `POST/cx/ai-agents/action-groups`: {
            if (!ajv.validate(cxAiAgentsActionGroupsPostBodySchema, event.body)) {
                console.error('validate body:', ajv.errors);
                const error = createError.BadRequest();
                error.cause = { data: ajv.errors };
                throw error;
            }
            return {
                data: await bedrockAgentService.addActionGroupToAgent(event.body),
            };
        }
        case `PUT/cx/ai-agents/action-groups`: {
            if (!ajv.validate(cxAiAgentsActionGroupsPutBodySchema, event.body)) {
                console.error('validate body:', ajv.errors);
                const error = createError.BadRequest();
                error.cause = { data: ajv.errors };
                throw error;
            }
            return {
                data: await bedrockAgentService.updateActionGroupForAgent(event.body),
            };
        }
        case `DELETE/cx/ai-agents/action-groups`: {
            if (!ajv.validate(cxAiAgentsActionGroupsDeleteQuerySchema, event.queryStringParameters)) {
                console.error('validate query:', ajv.errors);
                const error = createError.BadRequest();
                error.cause = { data: ajv.errors };
                throw error;
            }
            return {
                data: await bedrockAgentService.deleteActionGroupFromAgent(event.queryStringParameters),
            };
        }
        // case `GET/cx/ai-agents/collaborator/list`: {
        //     if (!ajv.validate(cxAiAgentsCollaboratorListGetQuery, event.queryStringParameters)) {
        //         console.error('validate query:', ajv.errors);
        //         const error = createError.BadRequest();
        //         error.cause = { data: ajv.errors };
        //         throw error;
        //     }
        //     return {
        //         data: await bedrockAgentService.getListAgentCollaborators(event.queryStringParameters),
        //     };
        // }
        case `POST/cx/ai-agents/collaborator`: {
            if (!ajv.validate(cxAiAgentsCollaboratorPostBody, event.body)) {
                console.error('validate body:', ajv.errors);
                const error = createError.BadRequest();
                error.cause = { data: ajv.errors };
                throw error;
            }
            return {
                data: await bedrockAgentService.addCollaboratorToAgent(event.body),
            };
        }
        case `PUT/cx/ai-agents/collaborator`: {
            if (!ajv.validate(cxAiAgentsCollaboratorPutBody, event.body)) {
                console.error('validate body:', ajv.errors);
                const error = createError.BadRequest();
                error.cause = { data: ajv.errors };
                throw error;
            }
            return {
                data: await bedrockAgentService.updateCollaboratorForAgent(event.body),
            };
        }
        case `DELETE/cx/ai-agents/collaborator`: {
            if (!ajv.validate(cxAiAgentsCollaboratorDeleteQuery, event.queryStringParameters)) {
                console.error('validate query:', ajv.errors);
                const error = createError.BadRequest();
                error.cause = { data: ajv.errors };
                throw error;
            }
            return {
                data: await bedrockAgentService.deleteCollaboratorFromAgent(event.queryStringParameters),
            };
        }
        // case `GET/cx/ai-agents/knowledge-base/list`: {
        //     if (!ajv.validate(cxAiAgentsKnowledgeBaseListGetQuery, event.queryStringParameters)) {
        //         console.error('validate query:', ajv.errors);
        //         const error = createError.BadRequest();
        //         error.cause = { data: ajv.errors };
        //         throw error;
        //     }
        //     return {
        //         data: await bedrockAgentService.getListAgentKnowledgeBases(event.queryStringParameters),
        //     };
        // }
        case `POST/cx/ai-agents/knowledge-base`: {
            if (!ajv.validate(cxAiAgentsKnowledgeBasePostBody, event.body)) {
                console.error('validate body:', ajv.errors);
                const error = createError.BadRequest();
                error.cause = { data: ajv.errors };
                throw error;
            }
            return {
                data: await bedrockAgentService.addKnowledgeBaseToAgent(event.body),
            };
        }
        case `PUT/cx/ai-agents/knowledge-base`: {
            if (!ajv.validate(cxAiAgentsKnowledgeBasePostBody, event.body)) {
                console.error('validate body:', ajv.errors);
                const error = createError.BadRequest();
                error.cause = { data: ajv.errors };
                throw error;
            }
            return {
                data: await bedrockAgentService.updateKnowledgeBaseForAgent(event.body),
            };
        }
        case `DELETE/cx/ai-agents/knowledge-base`: {
            if (!ajv.validate(cxAiAgentsKnowledgeBaseDeleteQuery, event.queryStringParameters)) {
                console.error('validate query:', ajv.errors);
                const error = createError.BadRequest();
                error.cause = { data: ajv.errors };
                throw error;
            }
            return {
                data: await bedrockAgentService.deleteKnowledgeBaseFromAgent(event.queryStringParameters),
            };
        }
        case `GET/cx/ai-agents`: {
            if (!ajv.validate(cxAiAgentsGetQuery, event.queryStringParameters)) {
                console.error('validate query:', ajv.errors);
                const error = createError.BadRequest();
                error.cause = { data: ajv.errors };
                throw error;
            }
            return {
                data: await bedrockAgentService.getAgent(event.queryStringParameters),
            };
        }
        default:
            throw new Error('Unsupported operation');
    }
}).use([
    inputOutputLogger(),
    httpJsonBodyParser({
        disableContentTypeError: true,
    }),
    validator({ eventSchema: ajv.compile(eventSchema) }),
    httpResponseFormatter(),
    httpErrorFormatter(),
]);
