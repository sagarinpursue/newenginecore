DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'orders_account_id_fkey'
        AND conrelid = 'public.orders'::regclass
    ) THEN
        ALTER TABLE public.orders 
        ADD CONSTRAINT orders_account_id_fkey 
        FOREIGN KEY (account_id) 
        REFERENCES accounts(account_id)
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'orders_service_code_fkey'
        AND conrelid = 'public.orders'::regclass
    ) THEN
        ALTER TABLE public.orders 
        ADD CONSTRAINT orders_service_code_fkey 
        FOREIGN KEY (service_code) 
        REFERENCES services(service_code)
    END IF;
END $$;