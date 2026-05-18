CREATE TABLE
    public.chat_message_feedbacks (
        chat_message_feedback_id uuid DEFAULT gen_random_uuid () NOT NULL,
        feedback_reason text NOT NULL,
        feedback_text text NULL,
        created_at timestamptz DEFAULT now() NOT NULL,
        updated_at timestamptz DEFAULT now() NOT NULL,
        chat_message_id uuid NOT NULL,
        CONSTRAINT chat_message_feedbacks_chat_message_id_key UNIQUE (chat_message_id),
        CONSTRAINT chat_message_feedbacks_pkey PRIMARY KEY (chat_message_feedback_id),
        CONSTRAINT chat_message_feedbacks_chat_message_id_fkey FOREIGN KEY (chat_message_id) REFERENCES public.chat_messages (chat_message_id)
    );

ALTER TABLE public.chat_message_feedbacks ENABLE ROW LEVEL SECURITY;

CREATE POLICY authAll ON public.chat_message_feedbacks AS PERMISSIVE FOR ALL TO authenticated USING (true);

-- Table Triggers
create trigger "chat_message_feedbacks-set_updated_at" before
update on public.chat_message_feedbacks for each row
execute function set_updated_at ();