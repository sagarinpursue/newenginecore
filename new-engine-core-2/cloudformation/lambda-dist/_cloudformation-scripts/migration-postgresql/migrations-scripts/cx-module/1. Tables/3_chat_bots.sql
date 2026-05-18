CREATE TABLE
    public.chat_bots (
        chat_bot_id uuid DEFAULT gen_random_uuid () NOT NULL,
        created_at timestamptz DEFAULT now() NOT NULL,
        bot_id text NOT NULL,
        bot_alias_id text NOT NULL,
        updated_at timestamptz DEFAULT now() NOT NULL,
        llm_structure_id uuid NULL,
        knowledge_base_id text NOT NULL,
        CONSTRAINT chat_bots_pkey PRIMARY KEY (chat_bot_id),
        CONSTRAINT chat_bots_llm_structure_id_fkey FOREIGN KEY (llm_structure_id) REFERENCES public.llm_structure (llm_structure_id)
    );

ALTER TABLE public.chat_bots ENABLE ROW LEVEL SECURITY;

CREATE POLICY authAll ON public.chat_bots AS PERMISSIVE FOR ALL TO authenticated USING (true);

-- Table Triggers
create trigger "chat_bot-set_updated_at" before
update on public.chat_bots for each row
execute function set_updated_at ();