-- Create table with columns
CREATE TABLE
    IF NOT EXISTS public.services (service_id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid());

ALTER TABLE public.services
ADD COLUMN IF NOT EXISTS service_code uuid NOT NULL DEFAULT gen_random_uuid();
ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now () CHECK ((created_at = DEFAULT)),
ADD COLUMN IF NOT EXISTS service_name_en text NOT NULL,
ADD COLUMN IF NOT EXISTS service_name_ar text NOT NULL,
ADD COLUMN IF NOT EXISTS beneficiary text NOT NULL,
ADD COLUMN IF NOT EXISTS service_type text NOT NULL,
ADD COLUMN IF NOT EXISTS sla INT4 NOT NULL,
ADD COLUMN IF NOT EXISTS service_channel TEXT NOT NULL,
ADD COLUMN IF NOT EXISTS service_external_id TEXT NOT NULL,
ADD COLUMN IF NOT EXISTS account_id UUID NOT NULL;

DO $$
BEGIN
-- Create policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policy WHERE polname = 'AccessSelectServices'
    ) THEN
        CREATE POLICY AccessSelectServices ON public.services AS PERMISSIVE FOR
        SELECT
            TO authenticated USING (
                (
                    (
                        SELECT
                            user_refs.user_account_id
                        FROM
                            user_refs
                        WHERE
                            (user_refs.user_id = auth.uid ())
                    ) = account_id
                )
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policy WHERE polname = 'RootAccessSelectServices'
    ) THEN
        CREATE POLICY RootAccessSelectServices ON public.services AS PERMISSIVE FOR
        SELECT
            TO authenticated USING (
                (
                    (
                        SELECT
                            user_refs.user_account_id
                        FROM
                            user_refs
                        WHERE
                            (user_refs.user_id = auth.uid ())
                    ) = '00000000-0000-0000-0000-000000000000'
                )
            );
    END IF;

--  Create indexes
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = 'services' 
        AND indexname = 'services_service_code_key'
    ) THEN
        CREATE UNIQUE INDEX services_service_code_key 
        ON public.services USING btree (service_code);
    END IF;
END $$;