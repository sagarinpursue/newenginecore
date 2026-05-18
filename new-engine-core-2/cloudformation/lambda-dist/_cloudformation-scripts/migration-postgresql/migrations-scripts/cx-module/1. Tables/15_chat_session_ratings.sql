CREATE TABLE
    public.chat_session_ratings (
        chat_session_rating_id uuid DEFAULT gen_random_uuid () NOT NULL,
        rating int8 NOT NULL,
        chat_session_id uuid NOT NULL,
        created_at timestamptz DEFAULT now() NOT NULL,
        updated_at timestamptz DEFAULT now() NOT NULL,
        CONSTRAINT chat_session_ratings_chat_session_id_key UNIQUE (chat_session_id),
        CONSTRAINT chat_session_ratings_pkey PRIMARY KEY (chat_session_rating_id),
        CONSTRAINT chat_session_ratings_chat_session_id_fkey FOREIGN KEY (chat_session_id) REFERENCES public.chatbot_sessions (session_id)
    );

ALTER TABLE public.chat_session_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY authAll ON public.chat_session_ratings AS PERMISSIVE FOR ALL TO authenticated USING (true);

-- Table Triggers
create trigger "chat_session_ratings-set_updated_at" before
update on public.chat_session_ratings for each row
execute function set_updated_at ();