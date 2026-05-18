ALTER TABLE public.connect_instances
    ADD COLUMN IF NOT EXISTS region text NULL,
    ADD COLUMN IF NOT EXISTS ccp_url text NULL;
