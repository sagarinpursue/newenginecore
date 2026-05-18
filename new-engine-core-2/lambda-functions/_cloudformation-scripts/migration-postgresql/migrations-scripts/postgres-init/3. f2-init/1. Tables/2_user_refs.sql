CREATE TABLE
    public.user_refs (
        user_id uuid DEFAULT gen_random_uuid () NOT NULL,
        user_account_id uuid DEFAULT gen_random_uuid () NOT NULL,
        user_name text NULL,
        meta_data jsonb NULL,
        full_name text NULL,
        phone text NULL,
        user_role text NULL,
        CONSTRAINT user_refs_pkey PRIMARY KEY (user_id),
        CONSTRAINT user_refs_user_account_id_fkey FOREIGN KEY (user_account_id) REFERENCES public.accounts (account_id),
        CONSTRAINT user_refs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE
    );