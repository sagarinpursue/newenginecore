CREATE TABLE public.cx_channel_questions (
     question_id uuid DEFAULT gen_random_uuid () NOT NULL PRIMARY KEY,
     channel_id uuid NOT NULL,
     account_id uuid NOT NULL,
     created_at timestamptz DEFAULT now() NOT NULL,
     updated_at timestamptz DEFAULT now() NOT NULL,
     question_en text NOT NULL,
     question_ar text NOT NULL,
     active boolean DEFAULT false NOT NULL,

     CONSTRAINT cx_channel_questions_channel_id_fkey
         FOREIGN KEY (channel_id)
         REFERENCES public.channels (channel_id)
         ON DELETE CASCADE,

     CONSTRAINT cx_channel_questions_account_id_fkey
         FOREIGN KEY (account_id)
         REFERENCES public.accounts (account_id)
);

CREATE INDEX cx_channel_questions_channel_id_active_idx
    ON public.cx_channel_questions (channel_id)
    WHERE active = true;

ALTER TABLE public.cx_channel_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY authAll ON public.cx_channel_questions AS PERMISSIVE FOR ALL TO authenticated
    USING (
        (get_invoker()).user_account_id = '00000000-0000-0000-0000-000000000000'::uuid
        OR
        (get_invoker()).user_account_id = account_id
    );

CREATE TRIGGER cx_channel_questions_set_updated_at_trg
    BEFORE UPDATE ON public.cx_channel_questions
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at ();
