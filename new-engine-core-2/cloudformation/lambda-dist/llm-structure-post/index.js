import { randomUUID } from 'crypto';
import { readFile } from 'fs/promises';

import middy from '@middy/core';
import httpJsonBodyParser from '@middy/http-json-body-parser';
import inputOutputLogger from '@middy/input-output-logger';
import secretsManager from '@middy/secrets-manager';
import validator from '@middy/validator';

import Ajv from 'ajv';

import { httpErrorFormatter, httpResponseFormatter } from '@shared-modules/f2-middlewares';

import LlmPromptDriverDb from './db/llm-prompt-driver-db.js';
import LlmQueryEngineDb from './db/llm-query-engine-db.js';
import LlmRulesetDb from './db/llm-ruleset-db.js';
import LlmStructureDb from './db/llm-structure-db.js';
import LlmStructureSharedTokenDb from './db/llm-structure-shared-token-db.js';
import LlmTaskDb from './db/llm-task-db.js';
import UserDb from './db/user-db.js';

// const eventSchema = (await import("./schemas/event.json", { assert: { type: "json" } })).default;
const eventSchema = JSON.parse(await readFile(new URL('./schemas/event.json', import.meta.url)));

// custom env vars
// const APP_NAME = process.env.APP_NAME;
// const ENV = process.env.ENV;
const DB_API_URL = process.env.DB_API_URL;
const JWT_AUTHORIZER_SECRET = process.env.JWT_AUTHORIZER_SECRET;

const ajv = new Ajv({ coerceTypes: 'number' });

export const handler = middy(async (event, context) => {
    console.log('event:', event);
    const token = event.headers.Authorization;

    const llmPromptDriverDb = new LlmPromptDriverDb(DB_API_URL, context.jwtAuth.anonKey, token);
    const llmRulesetDb = new LlmRulesetDb(DB_API_URL, context.jwtAuth.anonKey, token);
    const llmQueryEngineDb = new LlmQueryEngineDb(DB_API_URL, context.jwtAuth.anonKey, token);
    const llmTaskDb = new LlmTaskDb(DB_API_URL, context.jwtAuth.anonKey, token);
    const llmStructureDb = new LlmStructureDb(DB_API_URL, context.jwtAuth.anonKey, token);
    const llmStructureSharedTokenDb = new LlmStructureSharedTokenDb(DB_API_URL, context.jwtAuth.anonKey, token);
    const userDb = new UserDb(DB_API_URL, context.jwtAuth.anonKey, token);

    const userId = await userDb.get();
    console.log('userId:', userId);

    const accountId = await userDb.getAccount(userId);
    console.log('accountId:', accountId);

    const body = event.body;

    // flag says which LLM structure operation happened - creating or updating
    const isCreating = !body.llmStructureId;

    body.llmStructureId ??= randomUUID();
    body.llmTaskId ??= randomUUID();
    body.llmPromptDriverId ??= randomUUID();
    body.llmRulesetId ??= randomUUID();
    body.llmQueryEngineId ??= randomUUID();

    body.userId = userId;
    body.accountId = accountId;

    try {
        await createOrUpdateLlmStructure(llmStructureDb, body);
        await createOrUpdateLlmTask(llmTaskDb, body);
        await Promise.all([
            createOrUpdateLlmPromptDriver(llmPromptDriverDb, body),
            createOrUpdateLlmRuleset(llmRulesetDb, body),
            createOrUpdateLlmQueryEngine(llmQueryEngineDb, body),
            isCreating ? createLlmStructureSharedToken(llmStructureSharedTokenDb, body) : null,
        ]);
    } catch (err) {
        console.error(err);
        throw Error(err); // TODO: HTTP error
    }

    return {
        data: {
            llmStructureId: body.llmStructureId,
            llmTaskId: body.llmTaskId,
            llmPromptDriverId: body.llmPromptDriverId,
            llmQueryEngineId: body.llmQueryEngineId,
            llmRulesetId: body.llmRulesetId,
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

const createOrUpdateLlmStructure = async (llmStructureDb, body) => {
    const payload = {
        llmStructureId: body.llmStructureId,
        userId: body.userId,
        accountId: body.accountId,
        name: body.name,
        type: 'PIPELINE',
        framework: body.framework,
    };
    if (body.memorySize) {
        payload.memory = 'MEMORY';
        payload.memorySize = body.memorySize;
        payload.memoryDriver = 'DYNAMODB';
    } else {
        payload.memorySize = 0;
    }
    await llmStructureDb.createOrUpdate(payload);
};

const createLlmStructureSharedToken = async (llmStructureSharedTokenDb, body) => {
    const payload = {
        llmStructureSharedTokenId: randomUUID(),
        llmStructureId: body.llmStructureId,
        sharedToken: randomUUID(), // TODO: probably better algorithm should be used here
    };
    await llmStructureSharedTokenDb.create(payload);
};

const createOrUpdateLlmTask = async (llmTaskDb, body) => {
    const payload = {
        llmTaskId: body.llmTaskId,
        userId: body.userId,
        accountId: body.accountId,
        llmStructureId: body.llmStructureId,
        name: `${body.name} Prompt Task`,
        type: 'PROMPT',
        order: 1,
        input: '{{args[0]}}',
        assistantAppendix: body.assistantAppendix || '',
        preamble: body.preamble || '',
    };
    if (body.type === 'RAG') {
        payload.name = `${body.name} Text Query Task`;
        payload.type = 'TEXT_QUERY';
        payload.topN = body.topN || 5;
    } else if (body.type === 'Document') {
        payload.name = `${body.name} Document Query Task`;
        payload.type = 'DOCUMENT_QUERY';
    }
    await llmTaskDb.createOrUpdate(payload);
};

const createOrUpdateLlmPromptDriver = async (llmPromptDriverDb, body) => {
    await llmPromptDriverDb.createOrUpdate({
        llmPromptDriverId: body.llmPromptDriverId,
        userId: body.userId,
        accountId: body.accountId,
        llmTaskId: body.llmTaskId,
        name: `${body.name} Prompt Driver`,
        type: `BEDROCK`,
        model: body.model,
        topP: body.topP || 0,
        temperature: body.temperature || 0,
    });
};

const createOrUpdateLlmRuleset = async (llmRulesetDb, body) => {
    await llmRulesetDb.createOrUpdate({
        llmRulesetId: body.llmRulesetId,
        userId: body.userId,
        accountId: body.accountId,
        llmTaskId: body.llmTaskId,
        name: `${body.name} Ruleset`,
    });
};

const createOrUpdateLlmQueryEngine = async (llmQueryEngineDb, body) => {
    await llmQueryEngineDb.createOrUpdate({
        llmQueryEngineId: body.llmQueryEngineId,
        userId: body.userId,
        accountId: body.accountId,
        llmTaskId: body.llmTaskId,
        name: `${body.name} Query Engine`,
        useHybridSearch: body.isHybridSearch,
        useRagApi: body.isRagApi,
        embeddingDriver: body.embeddingDriver || '',
        namespace: body.sourceId,
        topN: body.topN || 5,
        vectorStoreDriver: body.sourceType,
    });
};
