CREATE TABLE
    IF NOT EXISTS public.orders (
        order_number text NOT NULL CHECK ((char_length(order_number) > 0)),
        account_id UUID NOT NULL,
        PRIMARY KEY (account_id, order_number)
    );

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS service_name TEXT,
ADD COLUMN IF NOT EXISTS personal_number_commercial_register TEXT,
ADD COLUMN IF NOT EXISTS submission_date DATE NOT NULL CHECK (submission_date < now),
ADD COLUMN IF NOT EXISTS completion_date DATE CHECK (
    (
        (
            (completion_date IS NOT NULL)
            AND (completion_date >= submission_date)
            AND (completion_date < now ())
        )
        OR (completion_date IS NULL)
    )
),
ADD COLUMN IF NOT EXISTS order_status text NOT NULL CHECK ((order_status IN ('executed/complete', 'in_progress', 'returned', 'rejected'))),
ADD COLUMN IF NOT EXISTS number_of_days int4 CHECK ((number_of_days >= 0)),
ADD COLUMN IF NOT EXISTS service_code text,
ADD COLUMN IF NOT EXISTS applicant_type text NOT NULL CHECK ((applicant_type IN ('individual/citizen', 'individual/resident', 'business_owner'))),
ADD COLUMN IF NOT EXISTS submission_channel text NOT NULL CHECK ((submission_channel IN ('electronic', 'in-person'))),
ADD COLUMN IF NOT EXISTS account_code text,
ADD COLUMN IF NOT EXISTS account_name text,
ADD COLUMN IF NOT EXISTS approval_dependencies boolean,
ADD COLUMN IF NOT EXISTS approving_entity_code text;


DO $$
BEGIN
-- Create policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policy WHERE polname = 'RootAccessSelectOrders'
    ) THEN
        CREATE POLICY RootAccessSelectOrders ON public.orders AS PERMISSIVE FOR
        SELECT
            TO authenticated USING (
                (
                    SELECT
                        user_refs.user_account_id
                    FROM
                        user_refs
                    WHERE
                        (user_refs.user_id = uid ())
                ) = '00000000-0000-0000-0000-000000000000'
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policy WHERE polname = 'AccessSelectOrders'
    ) THEN
        CREATE POLICY AccessSelectOrders ON public.orders AS PERMISSIVE FOR
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
        SELECT 1 FROM pg_policy WHERE polname = 'AccessInsertOrders'
    ) THEN
        CREATE POLICY AccessInsertOrders ON public.orders AS PERMISSIVE FOR INSERT TO authenticated USING (
            (
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
                AND (
                    service_code IN (
                        SELECT
                            services.service_code
                        FROM
                            services
                        WHERE
                            (services.account_id = orders.account_id)
                    )
                )
            )
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policy WHERE polname = 'AccessUpdateOrders'
    ) THEN
        CREATE POLICY AccessUpdateOrders ON public.orders AS PERMISSIVE FOR
        UPDATE TO authenticated USING (
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
        )
        WITH
            CHECK (true);
    END IF;
END $$;