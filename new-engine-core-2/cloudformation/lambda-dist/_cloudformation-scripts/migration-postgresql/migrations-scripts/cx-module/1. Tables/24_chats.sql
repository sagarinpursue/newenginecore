CREATE TYPE public.cx_chat_handler_type AS ENUM('ai_agent', 'lambda_function', 'legacy_bot');

ALTER TABLE public.chats
    ADD COLUMN IF NOT EXISTS handler_type public.cx_chat_handler_type DEFAULT 'ai_agent'::cx_chat_handler_type NOT NULL,
    ADD COLUMN IF NOT EXISTS lambda_function_name text NULL;
