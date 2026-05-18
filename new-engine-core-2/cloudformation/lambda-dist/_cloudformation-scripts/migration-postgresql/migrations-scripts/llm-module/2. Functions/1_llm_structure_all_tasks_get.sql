CREATE
OR REPLACE FUNCTION public.llm_structure_all_tasks_get (structure_id uuid) RETURNS record LANGUAGE sql AS $function$SELECT 
  s.*,
  jsonb_agg(t_full ORDER BY t_full->>'order') AS tasks
FROM llm_structure s
LEFT JOIN (
  SELECT 
    t.llm_structure_id,
    t.llm_task_id,
    to_jsonb(t) || 
    jsonb_build_object(
      'query_engine', to_jsonb(qe),
      'prompt_driver', to_jsonb(pd),
      'ruleset', to_jsonb(rs) || jsonb_build_object(
        'rules', COALESCE(rules.rules, '[]'::jsonb)
      )
    ) AS t_full
  FROM llm_task t
  LEFT JOIN LATERAL (
    SELECT * FROM llm_query_engine qe WHERE qe.llm_task_id = t.llm_task_id LIMIT 1
  ) qe ON TRUE
  LEFT JOIN LATERAL (
    SELECT * FROM llm_prompt_driver pd WHERE pd.llm_task_id = t.llm_task_id LIMIT 1
  ) pd ON TRUE
  LEFT JOIN LATERAL (
    SELECT * FROM llm_ruleset rs WHERE rs.llm_task_id = t.llm_task_id LIMIT 1
  ) rs ON TRUE
  LEFT JOIN LATERAL (
    SELECT jsonb_agg(to_jsonb(r)) AS rules
    FROM llm_rule r
    WHERE r.llm_ruleset_id = rs.llm_ruleset_id
  ) rules ON TRUE
) t_agg ON t_agg.llm_structure_id = s.llm_structure_id
WHERE s.llm_structure_id = structure_id
GROUP BY s.llm_structure_id;$function$;
