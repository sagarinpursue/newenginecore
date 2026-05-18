ALTER TABLE public.connect_instances
    ADD COLUMN IF NOT EXISTS account_id uuid NULL;

ALTER TABLE public.connect_instances
    DROP CONSTRAINT IF EXISTS connect_instances_account_id_fkey,
    ADD CONSTRAINT connect_instances_account_id_fkey
    FOREIGN KEY (account_id) REFERENCES public.accounts(account_id)
    ON DELETE NO ACTION;

DROP POLICY IF EXISTS authAll ON public.connect_instances;

CREATE POLICY authAll ON public.connect_instances AS PERMISSIVE FOR ALL TO authenticated
USING (
    (get_invoker()).user_account_id = '00000000-0000-0000-0000-000000000000'::uuid
    OR
    (get_invoker()).user_account_id = account_id
);
