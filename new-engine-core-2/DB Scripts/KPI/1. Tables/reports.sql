CREATE TABLE
    IF NOT EXISTS public.reports (report_id UUID NOT NULL PRIMARY KEY,);

ALTER TABLE public.reports
ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now() CHECK ((created_at = DEFAULT)),
ADD COLUMN IF NOT EXISTS uploaded_date date NOT NULL DEFAULT now()::date CHECK ((uploaded_date = DEFAULT)),
ADD COLUMN IF NOT EXISTS filename text NOT NULL,
ADD COLUMN IF NOT EXISTS file_url text,
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'uploaded',
ADD COLUMN IF NOT EXISTS account_id UUID NOT NULL,
ADD COLUMN IF NOT EXISTS user_id UUID NOT NULL DEFAULT auth.uid();


DO $$
BEGIN
-- Create policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policy WHERE polname = 'AccessInsertReports'
    ) THEN
        CREATE POLICY AccessInsertReports ON public.reports AS PERMISSIVE FOR INSERT TO authenticated USING (
            (
                (
                    SELECT
                        user_refs.user_account_id
                    FROM
                        user_refs
                    WHERE
                        (user_refs.user_id = auth.uid())
                ) = account_id
            )
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policy WHERE polname = 'AccessSelectReports'
    ) THEN
        CREATE POLICY AccessSelectReports ON public.reports AS PERMISSIVE FOR
        SELECT
            TO authenticated USING (
                (
                    (
                        SELECT
                            user_refs.user_account_id
                        FROM
                            user_refs
                        WHERE
                            (user_refs.user_id = auth.uid())
                    ) = account_id
                )
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policy WHERE polname = 'RootAccessSelectReports'
    ) THEN
        CREATE POLICY RootAccessSelectReports ON public.reports AS PERMISSIVE FOR
        SELECT
            TO authenticated USING (
                (
                    (
                        SELECT
                            user_refs.user_account_id
                        FROM
                            user_refs
                        WHERE
                            (user_refs.user_id = auth.uid())
                    ) = '00000000-0000-0000-0000-000000000000'
                )
            );
    END IF;
END $$;