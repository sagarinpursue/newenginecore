ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY RootAccessAccounts ON public.accounts AS PERMISSIVE FOR
SELECT
    TO authenticated USING (
        (
            (
                SELECT
                    user_refs.user_account_id
                FROM
                    user_refs
                WHERE
                    (user_refs.user_id=auth.uid())
            )='00000000-0000-0000-0000-000000000000'::UUID
        )
    );

CREATE POLICY AccessOnlySelfAccount ON public.accounts AS PERMISSIVE FOR
SELECT
    TO authenticated USING (
        (
            (
                SELECT
                    user_refs.user_account_id
                FROM
                    user_refs
                WHERE
                    (user_refs.user_id=auth.uid())
            )=account_id
        )
    );