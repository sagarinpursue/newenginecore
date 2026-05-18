CREATE TYPE public.chat_message_analysis_verdict AS ENUM('fail', 'success', 'wrong');

CREATE TABLE
    public.chat_message_analysis (
        question_id uuid NOT NULL PRIMARY KEY,
        answer_id uuid NOT NULL,
        session_id uuid NOT NULL,
        question text NOT NULL,
        answer text NOT NULL,
        category text NOT NULL DEFAULT 'other',
        verdict public.chat_message_analysis_verdict NOT NULL,
        created_at timestamptz DEFAULT now() NOT NULL,
        account_id uuid NOT NULL,
        channel_id uuid NOT NULL
);

ALTER TABLE public.chat_message_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY service ON public.chat_message_analysis FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY authSelect ON public.chat_message_analysis FOR SELECT TO authenticated USING (
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
                        (user_refs.user_account_id=chat_message_analysis.account_id)
                        OR (user_refs.user_account_id='00000000-0000-0000-0000-000000000000'::uuid)
                    )
                )
        )
    )
);
