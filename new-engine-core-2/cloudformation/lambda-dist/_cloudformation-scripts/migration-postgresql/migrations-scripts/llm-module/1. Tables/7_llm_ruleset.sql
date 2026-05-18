CREATE TABLE
    public.llm_ruleset (
        llm_ruleset_id uuid DEFAULT gen_random_uuid () NOT NULL,
        created_at timestamptz DEFAULT now() NOT NULL,
        "name" varchar NOT NULL,
        updated_at timestamptz DEFAULT now() NOT NULL,
        user_id uuid NOT NULL,
        account_id uuid NOT NULL,
        llm_task_id uuid NOT NULL,
        CONSTRAINT llm_ruleset_pkey PRIMARY KEY (llm_ruleset_id),
        CONSTRAINT llm_ruleset_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts (account_id),
        CONSTRAINT llm_ruleset_llm_task_id_fkey FOREIGN KEY (llm_task_id) REFERENCES public.llm_task (llm_task_id) ON DELETE CASCADE,
        CONSTRAINT llm_ruleset_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_refs (user_id)
    );

ALTER TABLE public.llm_ruleset ENABLE ROW LEVEL SECURITY;

CREATE POLICY auth ON public.llm_ruleset USING (
    (
        EXISTS (
            SELECT
                1
            FROM
                user_refs
            WHERE
                (
                    (user_refs.user_id=auth.uid ())
                    AND (
                        (user_refs.user_account_id=llm_ruleset.account_id)
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
                    user_refs
                WHERE
                    (
                        (user_refs.user_id=auth.uid ())
                        AND (
                            (user_refs.user_account_id=llm_ruleset.account_id)
                            OR (user_refs.user_account_id='00000000-0000-0000-0000-000000000000'::uuid)
                        )
                    )
            )
        )
    );

-- Table Triggers
create trigger "llm_ruleset-set_updated_at" before
update on public.llm_ruleset for each row
execute function set_updated_at ();