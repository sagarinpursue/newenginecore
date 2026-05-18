CREATE TYPE public.channel_type AS ENUM('web', 'custom', '360dialog');

ALTER TABLE public.channels
    ALTER COLUMN channel DROP DEFAULT;

ALTER TABLE public.channels
    ALTER COLUMN channel TYPE channel_type
    USING (
        CASE
            WHEN channel::text IN ('email', 'workplace', 'slack', 'facebook', 'msteams', 'instagram', 'whatsapp', 'twitter') THEN 'custom'::channel_type
            ELSE channel::text::channel_type
        END
    );

DROP TYPE public."channel_enum";

ALTER TABLE public.channels
    ADD COLUMN IF NOT EXISTS vendor_label text NULL,
    ADD COLUMN IF NOT EXISTS vendor_id text NULL UNIQUE;

CREATE INDEX channels_vendor_id_idx
    ON public.channels (vendor_id);
