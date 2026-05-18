CREATE TYPE public."chat_message_source_type" AS ENUM('client', 'lex', 'ai-agent', 'live-agent', 'system');

CREATE TYPE public."chat_message_type" AS ENUM('text', 'audio', 'image', 'file');

CREATE TABLE
    public.chat_messages (
        chat_message_id uuid DEFAULT gen_random_uuid () NOT NULL,
        "content" text NOT NULL,
        "source" public."chat_message_source_type" NOT NULL,
        message_type public."chat_message_type" NOT NULL,
        session_id uuid NOT NULL,
        created_at timestamptz DEFAULT now() NOT NULL,
        updated_at timestamptz DEFAULT now() NOT NULL,
        CONSTRAINT chat_messages_pkey PRIMARY KEY (chat_message_id),
        CONSTRAINT chat_messages_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.chatbot_sessions (session_id)
    );

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY authAll ON public.chat_messages AS PERMISSIVE FOR ALL TO authenticated USING (true);

-- Table Triggers
create trigger "chat_messages-set_updated_at" before
update on public.chat_messages for each row
execute function set_updated_at ();