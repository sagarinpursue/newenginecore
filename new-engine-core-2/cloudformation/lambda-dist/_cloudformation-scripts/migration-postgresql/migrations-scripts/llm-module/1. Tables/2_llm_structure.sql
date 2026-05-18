CREATE TABLE
    public.llm_structure (
        llm_structure_id uuid DEFAULT gen_random_uuid () NOT NULL,
        created_at timestamptz DEFAULT now() NOT NULL,
        updated_at timestamptz DEFAULT now() NOT NULL,
        "name" varchar NOT NULL,
        "type" varchar NOT NULL,
        framework varchar NOT NULL,
        memory varchar NULL,
        memory_size int2 DEFAULT '0'::smallint NOT NULL,
        memory_driver varchar NULL,
        user_id uuid NOT NULL,
        account_id uuid NOT NULL,
        CONSTRAINT llm_structure_pkey PRIMARY KEY (llm_structure_id),
        CONSTRAINT llm_structure_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts (account_id),
        CONSTRAINT llm_structure_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_refs (user_id)
    );

ALTER TABLE public.llm_structure ENABLE ROW LEVEL SECURITY;

CREATE POLICY auth ON public.llm_structure USING (
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
                    user_refs
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
create trigger "llm_structure-set_updated_at" before
update on public.llm_structure for each row
execute function set_updated_at ();