CREATE TABLE
    public.connect_contacts (
        contact_id uuid NOT NULL,
        session_id uuid DEFAULT gen_random_uuid () NULL,
        locale_id text DEFAULT 'en_US'::text NULL,
        email text NULL,
        full_name text NULL,
        phone_number text NULL,
        CONSTRAINT contact_session_pkey PRIMARY KEY (contact_id),
        CONSTRAINT contact_session_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.chatbot_sessions (session_id) ON DELETE CASCADE
    );

ALTER TABLE public.connect_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY authAll ON public.connect_contacts AS PERMISSIVE FOR ALL TO authenticated USING (true);