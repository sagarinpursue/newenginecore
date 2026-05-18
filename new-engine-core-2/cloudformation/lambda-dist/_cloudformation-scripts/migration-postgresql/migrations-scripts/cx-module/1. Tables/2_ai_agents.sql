CREATE TABLE
    public.ai_agents (
        ai_agent_id uuid DEFAULT gen_random_uuid () NOT NULL,
        agent_id text NOT NULL,
        agent_alias_id text NOT NULL,
        created_at timestamptz DEFAULT now() NOT NULL,
        updated_at timestamptz DEFAULT now() NULL,
        llm_structure_id uuid NULL,
        knowledge_base_id text NULL,
        agent_version text DEFAULT 'DRAFT'::text NULL,
        user_id uuid NULL,
        account_id uuid NULL,
        is_imported bool DEFAULT false NOT NULL,
        "name" text NULL,
        CONSTRAINT ai_agents_pkey PRIMARY KEY (ai_agent_id),
        CONSTRAINT ai_agents_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts (account_id),
        CONSTRAINT ai_agents_llm_structure_id_fkey FOREIGN KEY (llm_structure_id) REFERENCES public.llm_structure (llm_structure_id),
        CONSTRAINT ai_agents_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_refs (user_id)
    );

ALTER TABLE public.ai_agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY authAll ON public.ai_agents AS PERMISSIVE FOR ALL TO authenticated USING (true);

-- Table Triggers
create trigger "ai_agents-set_updated_at" before
update on public.ai_agents for each row
execute function set_updated_at ();