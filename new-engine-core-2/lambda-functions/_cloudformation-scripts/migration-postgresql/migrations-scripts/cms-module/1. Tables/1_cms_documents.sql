CREATE TABLE
    public.cms_documents (
        document_id uuid DEFAULT gen_random_uuid () NOT NULL,
        document_name text NOT NULL,
        user_id uuid NOT NULL,
        account_id uuid NOT NULL,
        created_at timestamptz DEFAULT now() NOT NULL,
        updated_at timestamptz DEFAULT now() NOT NULL,
        destination_folder text NULL,
        CONSTRAINT cms_documents_pkey PRIMARY KEY (document_id),
        CONSTRAINT cms_documents_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts (account_id),
        CONSTRAINT cms_documents_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_refs (user_id)
    );

ALTER TABLE public.cms_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY authAll ON public.cms_documents AS PERMISSIVE FOR ALL TO authenticated USING (true);

-- Table Triggers
create trigger "cms_documents-set_updated_at" before
update on public.cms_documents for each row
execute function set_updated_at ();