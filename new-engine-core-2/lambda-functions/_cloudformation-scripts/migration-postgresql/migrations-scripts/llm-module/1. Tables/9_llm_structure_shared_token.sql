CREATE TABLE
    public.llm_structure_shared_token (
        llm_structure_shared_token_id uuid DEFAULT gen_random_uuid () NOT NULL,
        created_at timestamptz DEFAULT now() NOT NULL,
        updated_at timestamptz DEFAULT now() NOT NULL,
        llm_structure_id uuid NOT NULL,
        shared_token varchar DEFAULT gen_random_uuid () NOT NULL,
        description varchar NULL,
        CONSTRAINT llm_structure_shared_token_pkey PRIMARY KEY (llm_structure_shared_token_id),
        CONSTRAINT llm_structure_shared_token_shared_token_key UNIQUE (shared_token),
        CONSTRAINT llm_structure_shared_token_llm_structure_id_fkey FOREIGN KEY (llm_structure_id) REFERENCES public.llm_structure (llm_structure_id) ON DELETE CASCADE
    );

ALTER TABLE public.llm_structure_shared_token ENABLE ROW LEVEL SECURITY;

CREATE POLICY auth ON public.llm_structure_shared_token USING (
    (
        EXISTS (
            SELECT
                1
            FROM
                (
                    user_refs
                    JOIN llm_structure ON ((llm_structure.llm_structure_id=llm_structure_shared_token.llm_structure_id))
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
)
WITH
    CHECK (
        (
            EXISTS (
                SELECT
                    1
                FROM
                    (
                        user_refs
                        JOIN llm_structure ON ((llm_structure.llm_structure_id=llm_structure_shared_token.llm_structure_id))
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

-- Table Triggers
create trigger "llm_structure_shared_token-set_updated_at" before
update on public.llm_structure_shared_token for each row
execute function set_updated_at ();