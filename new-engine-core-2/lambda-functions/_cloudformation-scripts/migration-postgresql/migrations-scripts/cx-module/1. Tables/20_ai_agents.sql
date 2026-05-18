ALTER TABLE public.ai_agents
    DROP CONSTRAINT ai_agents_llm_structure_id_fkey,
    DROP COLUMN llm_structure_id,
    DROP COLUMN knowledge_base_id,
    DROP COLUMN agent_version;