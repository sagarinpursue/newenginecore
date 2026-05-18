CREATE TABLE
    public.llm_log (
        llm_log_id uuid DEFAULT gen_random_uuid () NOT NULL,
        created_at timestamptz DEFAULT now() NOT NULL,
        updated_at timestamptz DEFAULT now() NOT NULL,
        llm_structure_id uuid NOT NULL,
        session_id uuid NOT NULL,
        question text NOT NULL,
        answer text NOT NULL,
        sources _text NULL,
        CONSTRAINT llm_log_pkey PRIMARY KEY (llm_log_id),
        CONSTRAINT llm_feedback_llm_structure_id_fkey FOREIGN KEY (llm_structure_id) REFERENCES public.llm_structure (llm_structure_id) ON DELETE CASCADE
    );

ALTER TABLE public.llm_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth-insert" ON public.llm_log
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

-- Table Triggers
create trigger "llm_feedback-set_updated_at" before
update on public.llm_log for each row
execute function set_updated_at ();