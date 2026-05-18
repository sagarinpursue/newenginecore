CREATE TYPE public."chat_message_rating_type" AS ENUM('upvote', 'downvote', 'pending');

CREATE TABLE
    public.chat_message_ratings (
        chat_message_rating_id uuid DEFAULT gen_random_uuid () NOT NULL,
        rating public."chat_message_rating_type" NOT NULL,
        chat_message_id uuid NOT NULL,
        created_at timestamptz DEFAULT now() NOT NULL,
        updated_at timestamptz DEFAULT now() NOT NULL,
        CONSTRAINT chat_message_ratings_chat_message_id_key UNIQUE (chat_message_id),
        CONSTRAINT chat_message_ratings_pkey PRIMARY KEY (chat_message_rating_id),
        CONSTRAINT chat_message_ratings_chat_message_id_fkey FOREIGN KEY (chat_message_id) REFERENCES public.chat_messages (chat_message_id)
    );

ALTER TABLE public.chat_message_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY authAll ON public.chat_message_ratings AS PERMISSIVE FOR ALL TO authenticated USING (true);

-- Table Triggers
create trigger "chat_message_ratings-set_updated_at" before
update on public.chat_message_ratings for each row
execute function set_updated_at ();