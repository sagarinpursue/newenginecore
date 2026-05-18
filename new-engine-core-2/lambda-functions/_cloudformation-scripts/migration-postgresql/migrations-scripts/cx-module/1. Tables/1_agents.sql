CREATE TABLE
    public.agents (
        agent_id uuid DEFAULT gen_random_uuid () NOT NULL,
        username text NOT NULL,
        "password" text NOT NULL,
        "role" text DEFAULT 'user'::text NOT NULL,
        created_at timestamptz DEFAULT now() NOT NULL,
        updated_at timestamptz DEFAULT now() NULL,
        instance_id uuid NULL,
        CONSTRAINT agents_pkey PRIMARY KEY (agent_id),
        CONSTRAINT agents_username_key UNIQUE (username),
        CONSTRAINT agents_instance_id_fkey FOREIGN KEY (instance_id) REFERENCES public.connect_instances (instance_id)
    );

ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY authAll ON public.agents AS PERMISSIVE FOR ALL TO authenticated USING (true);

-- Table Triggers
create trigger "agents-set_updated_at" before
update on public.agents for each row
execute function set_updated_at ();