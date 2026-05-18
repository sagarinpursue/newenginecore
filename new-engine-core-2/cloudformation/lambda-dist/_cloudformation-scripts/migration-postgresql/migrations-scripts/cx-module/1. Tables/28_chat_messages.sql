ALTER TABLE public.chat_messages
    ADD COLUMN IF NOT EXISTS answered_at timestamptz NULL;
