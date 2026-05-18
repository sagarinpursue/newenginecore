CREATE TABLE
    public.live_chat_sessions (
        chat_id text NOT NULL,
        session_id uuid NULL,
        created_at timestamptz DEFAULT now() NOT NULL,
        organisation_id uuid NULL,
        customer_access_token text NULL,
        entity_id uuid NULL,
        is_active bool NULL,
        email text NULL,
        full_name text NULL,
        phone_number text NULL,
        expires_at timestamptz NULL,
        updated_at timestamptz DEFAULT now() NULL,
        CONSTRAINT live_chat_sessions_pkey PRIMARY KEY (chat_id),
        CONSTRAINT live_chat_sessions_session_id_key UNIQUE (session_id),
        CONSTRAINT live_chat_sessions_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.chatbot_sessions (session_id) ON DELETE CASCADE
    );

CREATE INDEX live_chat_sessions_session_id_idx ON public.live_chat_sessions USING btree (session_id);

ALTER TABLE public.live_chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY authAll ON public.live_chat_sessions AS PERMISSIVE FOR ALL TO authenticated USING (true);

-- Table Triggers
create trigger "live_chat_sessions-set_updated_at" before
update on public.live_chat_sessions for each row
execute function set_updated_at ();