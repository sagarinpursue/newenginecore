DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'services_account_id_fkey'
        AND conrelid = 'public.services'::regclass
    ) THEN
        ALTER TABLE public.services 
        ADD CONSTRAINT services_account_id_fkey 
        FOREIGN KEY (account_id) 
        REFERENCES accounts(account_id)
    END IF;
END $$;