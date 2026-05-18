CREATE TABLE
    public.chatbot_sessions (
        session_id uuid DEFAULT gen_random_uuid () NOT NULL,
        connection_token text NULL,
        is_live_agent_connected bool DEFAULT false NULL,
        chat_id uuid NULL,
        created_at timestamptz DEFAULT now() NOT NULL,
        was_escalated_to_live_agent bool DEFAULT false NULL,
        CONSTRAINT lex_sessions_pkey PRIMARY KEY (session_id),
        CONSTRAINT chatbot_sessions_chat_id_fkey FOREIGN KEY (chat_id) REFERENCES public.chats (chat_id)
    );

ALTER TABLE public.chatbot_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY authAll ON public.chatbot_sessions AS PERMISSIVE FOR ALL TO authenticated USING (true);