// Native and 3rd party Node modules
import { BedrockClient, ListFoundationModelsCommand, ListInferenceProfilesCommand } from '@aws-sdk/client-bedrock';

import middy from '@middy/core';
import inputOutputLogger from '@middy/input-output-logger';
import validator from '@middy/validator';

import Ajv from 'ajv';
import ajvErrors from 'ajv-errors';
import ajvFormats from 'ajv-formats';

// Custom Node modules
import { httpErrorFormatter, httpResponseFormatter } from '@shared-modules/f2-middlewares';

import { eventSchema } from './schemas/event.js';

// System env vars
const REGION = process.env.AWS_REGION;

// AWS clients
const bedrockClient = new BedrockClient({ region: REGION });

// Create AJV instance and configure it with ajv-errors and ajv-formats
const ajv = new Ajv({ coerceTypes: 'number', strictTypes: false, allowUnionTypes: true, allErrors: true });
ajvFormats(ajv);
ajvErrors(ajv);

const ANTHROPIC_PROVIDER = 'Anthropic';
const AMAZON_PROVIDER = 'Amazon';
const IMAGE_INPUT_MODALITY = 'IMAGE';
const TEXT_OUTPUT_MODALITY = 'TEXT';
const SONNET_FAMILY = 'sonnet';
const ACTIVE_STATUS = 'ACTIVE';
const ON_DEMAND_INFERENCE_TYPE = 'ON_DEMAND';
const INFERENCE_PROFILE_INFERENCE_TYPE = 'INFERENCE_PROFILE';

export const handler = middy(async (event) => {
    // Get all foundation models and inference profiles
    const [anthropicModelsResponse, amazonModelsResponse, profilesResponse] = await Promise.all([
        bedrockClient.send(
            new ListFoundationModelsCommand({
                byProvider: ANTHROPIC_PROVIDER,
                byOutputModality: TEXT_OUTPUT_MODALITY,
            })
        ),
        bedrockClient.send(
            new ListFoundationModelsCommand({
                byProvider: AMAZON_PROVIDER,
                byOutputModality: TEXT_OUTPUT_MODALITY,
            })
        ),
        bedrockClient.send(new ListInferenceProfilesCommand({})),
    ]);

    const familyParam = event.queryStringParameters?.family;
    const families = familyParam ? familyParam.split(',') : [SONNET_FAMILY];
    console.log(families);

    // Filter for only active and match family
    const activeModels = [...anthropicModelsResponse.modelSummaries, ...amazonModelsResponse.modelSummaries].filter(
        (model) =>
            families.some((family) => model.modelId.includes(family)) &&
            // NOTE: Take the models that include `image` as an input modality
            model.inputModalities.includes(IMAGE_INPUT_MODALITY) &&
            // [IM] work around to get Claude 3.7 Sonnet on UI at any way
            (model.modelLifecycle?.status === ACTIVE_STATUS || model.modelId.includes('claude-3-7-sonnet')) &&
            (model.inferenceTypesSupported.includes(ON_DEMAND_INFERENCE_TYPE) ||
                model.inferenceTypesSupported.includes(INFERENCE_PROFILE_INFERENCE_TYPE))
    );
    console.log('activeModels:', activeModels);

    // Create a lookup map from model ARN to an ARRAY of profile IDs
    const profileMap = new Map();
    profilesResponse.inferenceProfileSummaries.forEach((profile) => {
        profile.models.forEach((modelInProfile) => {
            if (families.some((family) => modelInProfile.modelArn.includes(family))) {
                if (!profileMap.has(modelInProfile.modelArn)) {
                    profileMap.set(modelInProfile.modelArn, []);
                }
                profileMap.get(modelInProfile.modelArn).push(profile.inferenceProfileId);
            }
        });
    });

    // Combine the data to create the final summary list
    const summaryList = activeModels
        .map((model) => {
            const inferenceProfiles = profileMap.get(model.modelArn) || [];
            const onDemandProfiles = model.inferenceTypesSupported.includes(ON_DEMAND_INFERENCE_TYPE) ? [model.modelId] : [];
            const profiles = [...inferenceProfiles, ...onDemandProfiles];
            return profiles?.length ? profiles : [model.modelId];
        })
        .flat();
    console.log('summaryList:', summaryList);

    return {
        data: {
            models: summaryList,
        },
    };
}).use([
    inputOutputLogger(),
    validator({ eventSchema: ajv.compile(eventSchema) }),
    httpResponseFormatter(),
    httpErrorFormatter(),
]);
