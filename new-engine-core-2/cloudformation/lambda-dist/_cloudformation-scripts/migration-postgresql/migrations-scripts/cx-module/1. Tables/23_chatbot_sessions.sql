ALTER TABLE public.chatbot_sessions
    DROP CONSTRAINT IF EXISTS chatbot_sessions_chat_id_fkey,
    ADD CONSTRAINT chatbot_sessions_chat_id_fkey FOREIGN KEY (chat_id) REFERENCES public.chats (chat_id) ON DELETE SET NULL;
