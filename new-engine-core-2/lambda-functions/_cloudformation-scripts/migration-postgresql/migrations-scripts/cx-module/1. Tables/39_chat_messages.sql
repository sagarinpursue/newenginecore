ALTER TABLE public.chat_messages
    ADD COLUMN IF NOT EXISTS vendor_message_id text NULL;

CREATE INDEX chat_messages_vendor_message_id_source_idx
    ON public.chat_messages (vendor_message_id)
    WHERE source = 'ai-agent';
