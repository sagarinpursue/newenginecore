// Native and 3rd party Node modules
import { createClient } from '@supabase/supabase-js';

import { BedrockAgentClient } from '@aws-sdk/client-bedrock-agent';

import middy from '@middy/core';
import httpJsonBodyParser from '@middy/http-json-body-parser';
import inputOutputLogger from '@middy/input-output-logger';
import secretsManager from '@middy/secrets-manager';
import validator from '@middy/validator';

import Ajv from 'ajv';
import ajvErrors from 'ajv-errors';
import ajvFormats from 'ajv-formats';

// Custom Node modules
import { CxAiAgentDbApi } from '@shared-modules/f2-db-api';
import { httpErrorFormatter, httpResponseFormatter } from '@shared-modules/f2-middlewares';
import { camelToSnake } from '@shared-modules/utils';

import { eventSchema } from './schemas/event.js';
import BedrockAgentService from './services/bedrock-agent-service.js';

// System env vars

// Custom env vars
const REGION = process.env.AWS_REGION;
const DB_API_URL = process.env.DB_API_URL;
const JWT_AUTHORIZER_SECRET = process.env.JWT_AUTHORIZER_SECRET;

// Create AJV instance and configure it with ajv-errors and ajv-formats
const ajv = new Ajv({ coerceTypes: 'number', strictTypes: false, allowUnionTypes: true, allErrors: true });
ajvFormats(ajv);
ajvErrors(ajv);

// Constants
const DEFAULT_OFFSET = 0;
const DEFAULT_LIMIT = 10;

const RESOURCE_TYPE_TABLES = {
    users: 'user_refs',

    llm_data_sources: 'llm_data_sources',
    llm_structures: 'llm_structure',
    llm_structure_shared_tokens: 'llm_structure_shared_token',
    llm_structure_rules: 'llm_rule',
    llm_structure_logs: 'llm_log',

    cx_agents: 'agents',
    cx_ai_agents: 'ai_agents',
    cx_bots: 'chat_bots',
    cx_channels: 'channels',
    cx_channel_questions: 'cx_channel_questions',
    cx_chats: 'chats',
    cx_chat_sessions: 'chatbot_sessions',
    cx_chat_messages: 'chat_messages',
    cx_live_chat_instances: 'live_chat_instances',
    cx_chat_providers: 'chat_providers',
    cx_chat_session_feedbacks: 'chat_session_feedbacks',

    // proxy functions
    cx_ai_agent_action_groups: 'proxy/getListAgentActionGroups',
    cx_ai_agent_knowledge_bases: 'proxy/getListAgentKnowledgeBases',
    cx_ai_agent_collaborators: 'proxy/getListAgentCollaborators',

    // rpc functions
    cx_report_messages_feedbacks: 'rpc/cx_report_messages_feedbacks_get',
    cx_report_sessions_feedbacks: 'rpc/cx_report_sessions_feedbacks_get',
    cx_report_failed_responses: 'rpc/cx_report_failed_responses_get',
    cx_report_other_questions: 'rpc/cx_report_other_questions_get',
    cx_report_questions_categories: 'rpc/cx_report_questions_categories_get',
    cx_report_failed_deliveries: 'rpc/cx_report_failed_deliveries_get',
    cx_report_message_ratings: 'rpc/cx_report_message_ratings_get',
    cx_report_session_satisfaction: 'rpc/cx_report_session_satisfaction_get',
    cx_report_conversation_summaries: 'rpc/cx_report_conversation_summaries_get',
    cx_report_faq_questions: 'rpc/cx_report_faq_questions_get',
    cx_report_sources_frequency: 'rpc/cx_report_sources_frequency_get',
};

export const handler = middy(async (event, context) => {
    const {
        resourceType,
        searchBy,
        searchString,
        createdFrom,
        createdTo,
        sortBy,
        sortOrder,
        // TODO [IM] Remove offset and limit, to use page and pageSize only?
        offset,
        limit,
        page,
        pageSize,
        filter,
    } = event.body;
    const dbApiClient = createClient(DB_API_URL, context.jwtAuth.anonKey, {
        global: {
            headers: {
                Authorization: event.headers?.Authorization,
            },
        },
    });

    const dbTable = RESOURCE_TYPE_TABLES[resourceType];

    // Return empty list if dbTable is unknown
    if (!dbTable) {
        return {
            data: {
                items: [],
                totalItems: 0,
            },
        };
    }

    // Invoke rpc function
    if (dbTable.startsWith('rpc')) {
        const rpcFunctionName = dbTable.replace(/rpc\//, '');
        const getItemsFunctionName = rpcFunctionName;
        const getCountFunctionName = rpcFunctionName.replace(/_get$/, '_total_items_get');

        const args = {};
        if (createdFrom) args['p_start_date'] = createdFrom;
        if (createdTo) args['p_end_date'] = createdTo;
        if (pageSize) args['p_page_size'] = pageSize;
        if (page) args['p_page_number'] = page;
        if (filter.channelFilter) args['channel_filter'] = filter.channelFilter;
        if (filter.accountFilter) args['account_filter'] = filter.accountFilter;
        args['search_filter'] = searchString || '';

        const { data: items, error: getItemsError, status: getItemsStatus } = await dbApiClient.rpc(getItemsFunctionName, args);
        const {
            data: { count },
            error: getCountError,
            status: getCountStatus,
        } = await dbApiClient.rpc(getCountFunctionName, args).single();

        if (getItemsError) {
            const responseError = new Error();
            responseError.response = {
                data: {
                    code: getItemsError.code,
                    message: getItemsError.message,
                },
                getItemsStatus,
            };
            throw responseError;
        }
        if (getCountError) {
            const responseError = new Error();
            responseError.response = {
                data: {
                    code: getCountError.code,
                    message: getCountError.message,
                },
                getCountStatus,
            };
            throw responseError;
        }
        return {
            data: {
                items: items,
                totalItems: count,
            },
        };
    }

    // Invoke proxy function
    if (dbTable.startsWith('proxy')) {
        const proxyFunctionName = dbTable.replace(/proxy\//, '');

        try {
            const cxAiAgentDbApi = new CxAiAgentDbApi(DB_API_URL, context.jwtAuth.anonKey, event.headers?.Authorization);
            const aiAgent = await cxAiAgentDbApi.get(filter.aiAgentId);

            if (!aiAgent) {
                return { data: { items: [], totalItems: 0 } };
            }

            const bedrockAgentClient = new BedrockAgentClient({ region: REGION });
            const bedrockAgentService = new BedrockAgentService(bedrockAgentClient);

            const data = await bedrockAgentService[proxyFunctionName]({ agentId: aiAgent.agentId });

            // search
            const uniqueFoundItems = new Set();
            for (const searchProperty of searchBy) {
                for (const item of data) {
                    const value = item[searchProperty];

                    if (value === null || typeof value !== 'string') {
                        continue;
                    }

                    if (value.toLowerCase().includes(searchString.toLowerCase())) {
                        uniqueFoundItems.add(item);
                    }
                }
            }
            const items = Array.from(uniqueFoundItems);

            // TODO: createdFrom + createdTo

            // TODO: sortBy + sortOrder

            // pagination
            let paged_items = items;
            if (page && page > 0 && pageSize && pageSize > 0) {
                const start = (page - 1) * pageSize;
                const end = page * pageSize;
                paged_items = items.slice(start, end);
            }

            return { data: { items: paged_items, totalItems: items.length } };
        } catch (error) {
            console.error(error);
            return { data: { items: [], totalItems: 0 } };
        }
    }

    // TODO [IM] define select based on resource_type instead of using '*'
    let request = dbApiClient.from(dbTable).select('*', { count: 'exact' });
    if (resourceType === 'users') {
        request = dbApiClient.from(dbTable).select('*, ...accounts(account_name:account_name_en)', { count: 'exact' });
    }

    // Filter by search string
    if (searchBy?.length && searchString) {
        request = request.or(searchBy.map((columnName) => `${camelToSnake(columnName)}.ilike.%${searchString}%`).join());
    }

    // Filter by creation date
    if (createdFrom) {
        request = request.gte('created_at', createdFrom);
    }
    if (createdTo) {
        request = request.lte('created_at', createdTo);
    }

    // Filter by other properties
    if (filter) {
        Object.keys(filter).forEach((property) => {
            request = request.eq(camelToSnake(property), filter[property]);
        });
    }

    // Define soring
    if (sortBy) {
        request = request.order(camelToSnake(sortBy), { ascending: sortOrder === 'asc' });
    }

    // Define page settings
    let fromOffset = DEFAULT_OFFSET;
    let toOffset = fromOffset + DEFAULT_LIMIT - 1;
    if (offset !== undefined) {
        // --- Offset/Limit Strategy (Priority) ---
        fromOffset = offset;
        toOffset = fromOffset + (limit ?? DEFAULT_LIMIT) - 1;
    } else if (page !== undefined) {
        // --- Page/PageSize Strategy ---
        fromOffset = (page - 1) * (pageSize ?? DEFAULT_LIMIT);
        toOffset = fromOffset + (pageSize ?? DEFAULT_LIMIT) - 1;
    }
    console.log('fromOffset', fromOffset);
    console.log('toOffset', toOffset);
    request = request.range(fromOffset, toOffset);

    console.log(request);
    // Run request
    const { data, error, status, count } = await request;
    console.log('data', data);
    console.log('error', error);
    console.log('status', status);
    console.log('count', count);

    if (error) {
        if (error?.code === '42P01') {
            // return [] if table not found
            return {
                data: {
                    items: [],
                    totalItems: 0,
                },
            };
        } else {
            // Build error
            const responseError = new Error();
            responseError.response = {
                data: {
                    code: error.code,
                    message: error.message,
                },
                status,
            };
            throw responseError;
        }
    }

    return {
        data: {
            items: data,
            totalItems: count,
        },
    };
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
