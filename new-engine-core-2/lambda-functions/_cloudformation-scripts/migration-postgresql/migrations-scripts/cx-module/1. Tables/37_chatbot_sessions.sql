ALTER TABLE public.chatbot_sessions
    ADD COLUMN IF NOT EXISTS vendor_type text NULL,
    ADD COLUMN IF NOT EXISTS vendor_client_id text NULL;

CREATE INDEX chatbot_sessions_channel_id_vendor_client_id_last_activity_idx
    ON public.chatbot_sessions (channel_id, vendor_client_id, last_activity DESC);
