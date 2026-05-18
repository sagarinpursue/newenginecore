// Native and 3rd party Node modules

import middy from '@middy/core';
import httpJsonBodyParser from '@middy/http-json-body-parser';
import inputOutputLogger from '@middy/input-output-logger';
import secretsManager from '@middy/secrets-manager';
import validator from '@middy/validator';

import Ajv from 'ajv';
import ajvErrors from 'ajv-errors';
import ajvFormats from 'ajv-formats';

import { httpErrorFormatter, httpResponseFormatter } from '@shared-modules/f2-middlewares';

// Custom Node modules
import DbApi from './api/db-api.js';
import { eventSchema } from './schemas/event.js';

// System env vars

// Custom env vars
const DB_API_URL = process.env.DB_API_URL;
const JWT_AUTHORIZER_SECRET = process.env.JWT_AUTHORIZER_SECRET;

// Create AJV instance and configure it with ajv-errors and ajv-formats
const ajv = new Ajv({ coerceTypes: 'number', strictTypes: false, allowUnionTypes: true, allErrors: true });
ajvFormats(ajv);
ajvErrors(ajv);

export const handler = middy(async (event, context) => {
    const dbApi = new DbApi(
        DB_API_URL,
        context.jwtAuth.anonKey,
        context.jwtAuth.serviceRoleKey,
        event.httpMethod,
        event.headers,
        event.body,
        event.queryStringParameters,
        event.multiValueQueryStringParameters
    );
    switch (event.httpMethod + event.path) {
        // Auth
        case `POST/token`:
            return dbApi.callAuth('token');
        case 'POST/invite':
            return dbApi.callAuth('invite', true);

        // Accounts/Users
        case `GET/account/list`:
            return dbApi.callRest('accounts');
        case `GET/user/list`:
            return dbApi.callRest('user_refs');
        case `GET/user`:
            return dbApi.callRest('user_refs');
        case 'PATCH/user':
            return dbApi.callRest('user_refs');
        case `PUT/user`:
            return dbApi.callAuth('user');
        case 'POST/user':
            return dbApi.callAuth('admin/users', true);

        // KPI
        case `POST/entity/list/statistics`:
            return dbApi.callRest('rpc/get_entity_list_statistics');
        case `GET/service/list`:
            return dbApi.callRest('services');
        case `POST/service/list/statistics`:
            return dbApi.callRest('rpc/get_service_statistics');
        case `POST/order/list/statistics`:
            return dbApi.callRest('rpc/get_orders_statistics');
        case `POST/order`:
            return dbApi.callRest('orders');
        case `GET/account/list/without-report`:
            return dbApi.callRest('accounts');
        case `GET/report/list`:
        case `POST/report`:
            return dbApi.callRest('reports');

        // LLM (GA Module)
        case `GET/llm-data-source/list`:
        case `GET/llm-data-source`:
        case `PATCH/llm-data-source`:
            return dbApi.callRest('llm_data_sources');
        case `GET/llm-structure/list`:
        case `DELETE/llm-structure`:
            return dbApi.callRest('llm_structure');
        case `GET/llm-structure`:
            return dbApi.callRest('rpc/llm_structure_first_task_get');
        case `GET/llm-structure/shared-token/list`:
        case `GET/llm-structure/shared-token`:
        case `DELETE/llm-structure/shared-token`:
        case `POST/llm-structure/shared-token`:
        case `PATCH/llm-structure/shared-token`:
            return dbApi.callRest('llm_structure_shared_token');
        case `GET/llm-rule/list`:
        case `GET/llm-rule`:
        case `POST/llm-rule`:
        case `PATCH/llm-rule`:
        case `DELETE/llm-rule`:
            return dbApi.callRest('llm_rule');
        case `GET/llm-log/list`:
            return dbApi.callRest('llm_log');

        // Agents (CX Module)
        case `GET/cx/agents/list`:
            return dbApi.callRest('agents');

        // LiveChat instances (CX Module)
        case `GET/cx/live-chat-instances/list`:
            return dbApi.callRest('live_chat_instances');

        // Chats (CX Module)
        case `GET/cx/chats/list`:
        case `GET/cx/chat`:
        case `POST/cx/chat`:
        case `PATCH/cx/chat`:
        case `DELETE/cx/chat`:
            return dbApi.callRest('chats');
        case `GET/cx/chats/sessions`:
            return dbApi.callRest('chatbot_sessions');
        case `GET/cx/chats/messages`:
            return dbApi.callRest('chat_messages');

        // Dashboard/Reports (CX Module)
        case `GET/cx/dashboard/metrics`:
            return dbApi.callRest('rpc/cx_dashboard_metrics_group_get', true);
        case `GET/cx/dashboard/360-statuses`:
            return dbApi.callRest('rpc/cx_dashboard_360_statuses_group_get', true);

        // Channels (CX Module)
        case `GET/cx/channels/list`:
        case `GET/cx/channel`:
            return dbApi.callRest('channels');
        case `POST/cx/channel/question`:
        case `PATCH/cx/channel/question`:
        case `DELETE/cx/channel/question`:
            return dbApi.callRest('cx_channel_questions');

        // Providers (CX Module)
        case `GET/cx/providers/list`:
            return dbApi.callRest('chat_providers');

        // Chat message rating
        // TODO: we want to keep 'public' in the paths like this, right?
        case `POST/public/chat_messages/rating`:
        case `PATCH/public/chat_messages/rating`:
        case `DELETE/public/chat_messages/rating`:
            return dbApi.callRest('chat_message_ratings');

        // Chat message feedback
        case `POST/public/chat_messages/feedback`:
            return dbApi.callRest('chat_message_feedbacks');

        // Chat session rating
        case `POST/public/chat_sessions/rating`:
            return dbApi.callRest('chat_session_ratings');

        // Chat session feedback
        case `POST/public/chat_sessions/feedback`:
            return dbApi.callRest('chat_session_feedbacks');

        // Chat message report
        case `POST/public/chat_messages/report`:
            return dbApi.callRest('chat_message_reports');

        case `POST/public/chat-sessions`:
            return dbApi.callRest('chatbot_sessions');

        default:
            throw new Error();
    }
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
