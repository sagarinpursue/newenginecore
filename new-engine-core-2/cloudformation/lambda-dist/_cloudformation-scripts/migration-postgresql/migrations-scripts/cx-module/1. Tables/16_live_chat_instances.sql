CREATE TABLE
    public.live_chat_instances (
        client_id text NOT NULL,
        organisation_id uuid NOT NULL,
        account_id uuid NOT NULL,
        created_at timestamptz DEFAULT now() NOT NULL,
        updated_at timestamptz DEFAULT now() NOT NULL,
        CONSTRAINT live_chat_instances_pkey PRIMARY KEY (client_id)
    );

ALTER TABLE public.live_chat_instances ENABLE ROW LEVEL SECURITY;

CREATE POLICY authAll ON public.live_chat_instances AS PERMISSIVE FOR ALL TO authenticated USING (true);

-- Table Triggers
create trigger "live_chat_instances-set_updated_at" before
update on public.live_chat_instances for each row
execute function set_updated_at ();