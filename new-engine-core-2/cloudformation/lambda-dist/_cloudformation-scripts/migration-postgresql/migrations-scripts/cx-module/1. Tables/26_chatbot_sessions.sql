ALTER TABLE public.chatbot_sessions
    ADD COLUMN IF NOT EXISTS account_id uuid NULL,
    ADD COLUMN IF NOT EXISTS channel_id uuid NULL;

ALTER TABLE public.chatbot_sessions
    DROP CONSTRAINT IF EXISTS chatbot_sessions_account_id_fkey,
    ADD CONSTRAINT chatbot_sessions_account_id_fkey
    FOREIGN KEY (account_id) REFERENCES public.accounts(account_id)
    ON DELETE NO ACTION;

ALTER TABLE public.chatbot_sessions
    DROP CONSTRAINT IF EXISTS chatbot_sessions_channel_id_fkey,
    ADD CONSTRAINT chatbot_sessions_channel_id_fkey
    FOREIGN KEY (channel_id) REFERENCES public.channels(channel_id)
    ON DELETE SET NULL;