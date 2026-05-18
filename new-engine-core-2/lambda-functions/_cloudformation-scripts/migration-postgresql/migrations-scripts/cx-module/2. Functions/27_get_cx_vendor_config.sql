CREATE OR REPLACE FUNCTION public.get_cx_vendor_config (vendor_id_param text)
RETURNS record
LANGUAGE sql
AS $$
    SELECT
        channels.channel_id AS "channelId",

        chats.chat_id AS "chatId",
        chats.chat_instance_id AS "chatInstanceId",
        chats.handler_type AS "handlerType",
        chats.lambda_function_name AS "lambdaFunctionName",
        chats.account_id AS "accountId",

        chat_providers.name AS "chatProvider",

        ai_agents.agent_id AS "aiAgentId",
        ai_agents.agent_alias_id AS "aiAgentAliasId"

    FROM channels
        LEFT JOIN chats ON channels.chat_id = chats.chat_id
        LEFT JOIN chat_providers ON chats.chat_provider_id = chat_providers.id
        LEFT JOIN ai_agents ON chats.ai_agent_id = ai_agents.ai_agent_id

    WHERE channels.vendor_id = vendor_id_param;
$$;
