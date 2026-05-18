CREATE TABLE
    public.chats (
        chat_id uuid DEFAULT gen_random_uuid () NOT NULL,
        ai_agent_id uuid NULL,
        bot_id uuid NULL,
        instance_id uuid NULL,
        created_at timestamptz DEFAULT now() NOT NULL,
        updated_at timestamptz DEFAULT now() NULL,
        "name" text NOT NULL,
        chat_instance_id text NULL,
        chat_provider_id int8 NULL,
        user_id uuid NOT NULL,
        account_id uuid NOT NULL,
        CONSTRAINT chats_name_key UNIQUE (name),
        CONSTRAINT chats_pkey PRIMARY KEY (chat_id),
        CONSTRAINT chats_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts (account_id),
        CONSTRAINT chats_ai_agent_id_fkey FOREIGN KEY (ai_agent_id) REFERENCES public.ai_agents (ai_agent_id),
        CONSTRAINT chats_bot_id_fkey FOREIGN KEY (bot_id) REFERENCES public.chat_bots (chat_bot_id),
        CONSTRAINT chats_chat_provider_id_fkey FOREIGN KEY (chat_provider_id) REFERENCES public.chat_providers (id),
        CONSTRAINT chats_instance_id_fkey FOREIGN KEY (instance_id) REFERENCES public.connect_instances (instance_id),
        CONSTRAINT chats_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_refs (user_id)
    );

ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

CREATE POLICY authAll ON public.chats AS PERMISSIVE FOR ALL TO authenticated USING (true);

-- Table Triggers
create trigger "chats-set_updated_at" before
update on public.chats for each row
execute function set_updated_at ();