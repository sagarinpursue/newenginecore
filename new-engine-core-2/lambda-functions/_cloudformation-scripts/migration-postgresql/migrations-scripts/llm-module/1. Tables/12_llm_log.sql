DROP POLICY IF EXISTS "auth-insert" ON public.llm_log;

CREATE POLICY "auth-insert" ON public.llm_log AS PERMISSIVE FOR INSERT TO authenticated
WITH
    CHECK (
        (
            EXISTS (
                SELECT
                    1
                FROM
                    (
                        user_refs
                        JOIN llm_structure ON ((llm_structure.llm_structure_id=llm_log.llm_structure_id))
                    )
                WHERE
                    (
                        (user_refs.user_id=auth.uid ())
                        AND (
                            (user_refs.user_account_id=llm_structure.account_id)
                            OR (user_refs.user_account_id='00000000-0000-0000-0000-000000000000'::uuid)
                        )
                    )
            )
        )
    );

CREATE POLICY "auth-select" ON public.llm_log AS PERMISSIVE FOR SELECT TO authenticated
USING (
        (
            EXISTS (
                SELECT
                    1
                FROM
                    (
                        user_refs
                        JOIN llm_structure ON ((llm_structure.llm_structure_id=llm_log.llm_structure_id))
                    )
                WHERE
                    (
                        (user_refs.user_id=auth.uid ())
                        AND (
                            (user_refs.user_account_id=llm_structure.account_id)
                            OR (user_refs.user_account_id='00000000-0000-0000-0000-000000000000'::uuid)
                        )
                    )
            )
        )
    );