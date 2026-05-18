import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

import middy from '@middy/core';
import secretsManager from '@middy/secrets-manager';

import { ChatMessageAnalysisDbApi } from '@shared-modules/f2-db-api';

const AWS_REGION = process.env.AWS_REGION;
const DB_API_URL = process.env.DB_API_URL;
const JWT_AUTHORIZER_SECRET = process.env.JWT_AUTHORIZER_SECRET;

const bedrockClient = new BedrockRuntimeClient({ region: AWS_REGION });

const RESPONSE_ANALYST_CONFIG = {
    model: 'amazon.nova-pro-v1:0',
    temperature: 0.1,
    topP: 0.2,
    // prompt: 'You are a strict QA evaluator of chatbot responses.' +
    //     '\n\nUser question:\n"{user_q}"' +
    //     '\n\nBot answer:\n"{bot_a}"' +
    //     '\n\nDid the bot fully and correctly answer the user\'s question?' +
    //     '\n\nAnswer ONLY:' +
    //     '\nYES — if the answer is relevant, meaningful, and actually addresses the question.' +
    //     '\nNO — if the answer is generic, evasive, fallback, unclear, or does not answer the question.' +
    //     '\n\nOutput only: YES or NO.',
    prompt:
        'You are Data Analyst in the chatbot system. Your role is to review chatbot answer and define when the chatbot fails to provide a meaningful response to a user query.\n' +
        'Answer only "FAIL"" or "SUCCESS" without any other explanations.\n\n' +
        'User: {user_q}\n' +
        'Bot: {bot_a}',
};

const CATEGORIES = ['greeting', 'new passport', 'renew passport', 'fees', 'issue id card', 'renew id card', 'other'];

const QUESTION_CATEGORIZER_CONFIG = {
    model: 'amazon.nova-pro-v1:0',
    temperature: 0.1,
    topP: 0.2,
    prompt:
        'You are Data Analyst in the chatbot system. Your role is to categorize user input into one of provided categories.\n' +
        'Answer only with category.\n\n' +
        'User Input: {user_i}\n' +
        'Categories: {categories}',
};

// TODO [IM] In future we should get RESPONSE_ANALYST_CONFIG, QUESTION_CATEGORIZER_CONFIG, and CATEGORIES from Parameter Store.
//  a special type of LLM Structures will change Parameter Store object during create/update/delete operations
//  OR we need some wizard (or settings page) which will allow to configure Parameter Store values
//  both approaches will allow to configure these variables from UI

export const handler = middy(async (event, context) => {
    console.log('event', JSON.stringify(event));

    const chatMessageAnalysisDb = new ChatMessageAnalysisDbApi(
        DB_API_URL,
        context.jwtAuth.serviceRoleKey,
        `Bearer ${context.jwtAuth.serviceRoleKey}`
    );

    for (const record of event.Records) {
        try {
            const body = JSON.parse(record.body);
            const { sessionId, questionId, answerId, question, answer, accountId, channelId } = body;

            const outputVerdictText = await callResponseAnalystModel(question, answer);
            const trimmedVerdictText = outputVerdictText.trim().toUpperCase();

            let verdict = 'wrong';
            if (
                trimmedVerdictText.startsWith('NO') ||
                trimmedVerdictText.endsWith('NO') ||
                trimmedVerdictText.startsWith('FAIL') ||
                trimmedVerdictText.endsWith('FAIL')
            ) {
                verdict = 'fail';
            } else if (
                trimmedVerdictText.startsWith('YES') ||
                trimmedVerdictText.endsWith('YES') ||
                trimmedVerdictText.startsWith('SUCCESS') ||
                trimmedVerdictText.endsWith('SUCCESS')
            ) {
                verdict = 'success';
            }

            const outputCategoryText = await callQuestionCategorizerModel(question);
            const trimmedCategoryText = outputCategoryText.replace(/ +/g, ' ').trim().toLowerCase();

            let category = trimmedCategoryText;
            if (!CATEGORIES.includes(trimmedCategoryText)) {
                console.error(`>>>>> Provided category '${trimmedCategoryText}' absent in the list.`);
                category = 'other';
            }

            const chatMessageAnalysis = {
                sessionId,
                questionId,
                answerId,
                question,
                answer,
                category,
                verdict,
                accountId,
                channelId,
            };
            console.log(JSON.stringify(chatMessageAnalysis));
            await chatMessageAnalysisDb.saveResult(chatMessageAnalysis);
        } catch (error) {
            console.error(`Error processing record ${record.messageId}:`, error);
        }
    }
}).use([
    secretsManager({
        fetchData: {
            jwtAuth: JWT_AUTHORIZER_SECRET,
        },
        disablePrefetch: true,
        setToContext: true,
    }),
]);

const callBedrockModel = async (prompt, config) => {
    try {
        const payload = {
            inferenceConfig: {
                temperature: config.temperature,
                topP: config.topP,
            },
            messages: [
                {
                    role: 'user',
                    content: [{ text: prompt }],
                },
            ],
        };

        const command = new InvokeModelCommand({
            modelId: config.model,
            body: JSON.stringify(payload),
            contentType: 'application/json',
            accept: 'application/json',
        });

        const response = await bedrockClient.send(command);
        const responseBody = JSON.parse(new TextDecoder().decode(response.body));
        return responseBody.output?.message?.content?.[0]?.text || '';
    } catch (error) {
        console.error('Error calling Bedrock:', error);
        return '';
    }
};

const callResponseAnalystModel = async (question, answer) => {
    const prompt = RESPONSE_ANALYST_CONFIG.prompt.replace('{user_q}', question).replace('{bot_a}', answer);
    const config = {
        temperature: RESPONSE_ANALYST_CONFIG.temperature,
        topP: RESPONSE_ANALYST_CONFIG.topP,
        model: RESPONSE_ANALYST_CONFIG.model,
    };

    console.log('>>>>> Prompt');
    console.log(prompt);

    const outputText = await callBedrockModel(prompt, config);

    console.log('>>>>> Output');
    console.log(outputText);

    return outputText;
};

const callQuestionCategorizerModel = async (question) => {
    const prompt = QUESTION_CATEGORIZER_CONFIG.prompt.replace('{user_i}', question).replace('{categories}', CATEGORIES.join(','));
    const config = {
        temperature: QUESTION_CATEGORIZER_CONFIG.temperature,
        topP: QUESTION_CATEGORIZER_CONFIG.topP,
        model: QUESTION_CATEGORIZER_CONFIG.model,
    };

    console.log('>>>>> Prompt');
    console.log(prompt);

    const outputText = await callBedrockModel(prompt, config);

    console.log('>>>>> Output');
    console.log(outputText);

    return outputText;
};
