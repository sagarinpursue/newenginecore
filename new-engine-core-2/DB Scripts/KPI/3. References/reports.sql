DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'reports_user_id_fkey'
        AND conrelid = 'public.reports'::regclass
    ) THEN
        ALTER TABLE public.reports 
        ADD CONSTRAINT reports_user_id_fkey 
        FOREIGN KEY (user_id) 
        REFERENCES user_refs(user_id)
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'reports_account_id_fkey'
        AND conrelid = 'public.reports'::regclass
    ) THEN
        ALTER TABLE public.reports 
        ADD CONSTRAINT reports_account_id_fkey
        FOREIGN KEY (account_id) 
        REFERENCES accounts(account_id)
    END IF;
END $$;