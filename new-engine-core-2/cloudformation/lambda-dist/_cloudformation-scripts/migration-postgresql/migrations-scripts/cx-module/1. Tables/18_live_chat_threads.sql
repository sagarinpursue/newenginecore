CREATE TABLE
    public.live_chat_threads (
        thread_id text NOT NULL,
        created_at timestamptz DEFAULT now() NOT NULL,
        chat_id text NULL,
        session_id uuid NULL,
        updated_at timestamptz DEFAULT now() NULL,
        CONSTRAINT live_chat_threads_pkey PRIMARY KEY (thread_id),
        CONSTRAINT live_chat_threads_chat_id_fkey FOREIGN KEY (chat_id) REFERENCES public.live_chat_sessions (chat_id) ON DELETE CASCADE,
        CONSTRAINT live_chat_threads_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.chatbot_sessions (session_id)
    );

ALTER TABLE public.live_chat_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY authAll ON public.live_chat_threads AS PERMISSIVE FOR ALL TO authenticated USING (true);

-- Table Triggers
create trigger "live_chat_threads-set_updated_at" before
update on public.live_chat_threads for each row
execute function set_updated_at ();