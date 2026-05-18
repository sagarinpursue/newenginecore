CREATE TABLE
    public.connect_instances (
        instance_id uuid DEFAULT gen_random_uuid () NOT NULL,
        created_at timestamptz DEFAULT now() NOT NULL,
        updated_at timestamptz DEFAULT now() NULL,
        flow_id uuid NULL,
        streaming_endpoint_topic text NULL,
        CONSTRAINT connect_instances_pkey PRIMARY KEY (instance_id)
    );

ALTER TABLE public.connect_instances ENABLE ROW LEVEL SECURITY;

CREATE POLICY authAll ON public.connect_instances AS PERMISSIVE FOR ALL TO authenticated USING (true);

-- Table Triggers
create trigger "connect_instances-set_updated_at" before
update on public.connect_instances for each row
execute function set_updated_at ();