ALTER TABLE public.channels
    DROP COLUMN api_key,
    DROP COLUMN phone_number,
    ADD COLUMN IF NOT EXISTS account_id UUID NOT NULL;

ALTER TABLE public.channels
    ADD CONSTRAINT llm_structure_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts (account_id);
