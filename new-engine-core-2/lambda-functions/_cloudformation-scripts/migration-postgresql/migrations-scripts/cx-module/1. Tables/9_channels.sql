-- DROP TYPE public."channel_enum";
CREATE TYPE public."channel_enum" AS ENUM('web', 'email', 'workplace', 'slack', 'facebook', 'msteams', 'instagram', 'whatsapp', 'twitter', 'custom');

COMMENT ON
TYPE public."channel_enum" IS 'The enum is used to store channel names';

CREATE TABLE
    public.channels (
        channel_id uuid DEFAULT gen_random_uuid () NOT NULL,
        channel public."channel_enum" DEFAULT 'web'::channel_enum NOT NULL,
        "name" text NOT NULL,
        chat_id uuid NOT NULL,
        api_key text NULL,
        phone_number text NULL,
        created_at timestamptz DEFAULT now() NOT NULL,
        updated_at timestamptz DEFAULT now() NULL,
        domain_name varchar NULL,
        distribution_id varchar NULL,
        CONSTRAINT channels_name_key UNIQUE (name),
        CONSTRAINT channels_pkey PRIMARY KEY (channel_id),
        CONSTRAINT channels_chat_id_fkey FOREIGN KEY (chat_id) REFERENCES public.chats (chat_id)
    );

ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY authAll ON public.channels AS PERMISSIVE FOR ALL TO authenticated USING (true);

-- Table Triggers
create trigger "channels-set_updated_at" before
update on public.channels for each row
execute function set_updated_at ();