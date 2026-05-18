CREATE
OR REPLACE FUNCTION public.llm_structure_first_task_get (structure_id uuid) RETURNS record LANGUAGE sql AS $function$SELECT 
  -- structure
  s.llm_structure_id,
  s.name,
  s.framework,
  s.memory,
  coalesce(s.memory_size, 0) memory_size,
  s.memory_driver,

  -- first task
  t.llm_task_id,
  t.assistant_appendix,
  t.preamble,
  CASE 
    WHEN t.type IS NULL THEN 'General Knowledge'
    WHEN t.type = 'PROMPT' THEN 'General Knowledge'
    WHEN t.type = 'TEXT_QUERY' THEN 'RAG'
    WHEN t.type = 'DOCUMENT_QUERY' THEN 'Document'
    ELSE 'General Knowledge'
  END AS type,

  -- first task query engine
  qe.llm_query_engine_id,
  qe.use_hybrid_search,
  qe.use_rag_api,
  qe.embedding_driver,
  qe.vector_store_driver,
  qe.namespace,
  qe.top_n,

  -- first task prompt driver
  pd.llm_prompt_driver_id,
  pd.model,
  pd.temperature,
  pd.top_p,

  -- first task ruleset
  rs.llm_ruleset_id
FROM llm_structure s
LEFT JOIN LATERAL (
  SELECT * FROM llm_task 
  WHERE llm_task.llm_structure_id = s.llm_structure_id
  ORDER BY llm_task.order ASC  -- Change to DESC for highest order
  LIMIT 1
) t ON TRUE
LEFT JOIN llm_query_engine qe ON qe.llm_task_id = t.llm_task_id
LEFT JOIN llm_prompt_driver pd ON pd.llm_task_id = t.llm_task_id
LEFT JOIN llm_ruleset rs ON rs.llm_task_id = t.llm_task_id
WHERE s.llm_structure_id = structure_id;$function$;