CREATE TABLE
    public.llm_rule (
        llm_rule_id uuid DEFAULT gen_random_uuid () NOT NULL,
        created_at timestamptz DEFAULT now() NOT NULL,
        updated_at timestamptz DEFAULT now() NOT NULL,
        llm_ruleset_id uuid NOT NULL,
        "name" varchar NOT NULL,
        value varchar NOT NULL,
        user_id uuid NOT NULL,
        account_id uuid NOT NULL,
        CONSTRAINT llm_rule_pkey PRIMARY KEY (llm_rule_id),
        CONSTRAINT llm_rule_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts (account_id),
        CONSTRAINT llm_rule_llm_ruleset_id_fkey FOREIGN KEY (llm_ruleset_id) REFERENCES public.llm_ruleset (llm_ruleset_id) ON DELETE CASCADE,
        CONSTRAINT llm_rule_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_refs (user_id)
    );

ALTER TABLE public.llm_rule ENABLE ROW LEVEL SECURITY;

CREATE POLICY auth ON public.llm_rule USING (
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
                        (user_refs.user_account_id=llm_rule.account_id)
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
                            (user_refs.user_account_id=llm_rule.account_id)
                            OR (user_refs.user_account_id='00000000-0000-0000-0000-000000000000'::uuid)
                        )
                    )
            )
        )
    );

-- Table Triggers
create trigger "llm_rule-set_updated_at" before
update on public.llm_rule for each row
execute function set_updated_at ();