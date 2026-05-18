CREATE
OR REPLACE FUNCTION public.get_cx_chat_config (channel_id_param uuid) RETURNS record LANGUAGE sql AS $function$SELECT
    chats.chat_id AS "chatId",
    chats.chat_instance_id AS "chatInstanceId",
    chat_providers.name AS "chatProvider",

    ai_agents.agent_id AS "aiAgentId",
    ai_agents.agent_alias_id AS "aiAgentAliasId",
    ai_agents.llm_structure_id AS "aiAgentLlmStructureId",
    ai_agents.knowledge_base_id AS "aiAgentKnowledgeBaseId",

    chat_bots.bot_id AS "botId",
    chat_bots.bot_alias_id AS "botAliasId",
    chat_bots.llm_structure_id AS "botLlmStructureId",
    chat_bots.knowledge_base_id AS "botKnowledgeBaseId"

FROM channels
LEFT JOIN chats ON channels.chat_id = chats.chat_id
LEFT JOIN chat_providers ON chats.chat_provider_id = chat_providers.id
LEFT JOIN connect_instances ON chats.instance_id = connect_instances.instance_id
LEFT JOIN ai_agents ON chats.ai_agent_id = ai_agents.ai_agent_id
LEFT JOIN chat_bots ON chats.bot_id = chat_bots.chat_bot_id

WHERE channels.channel_id = channel_id_param;$function$;