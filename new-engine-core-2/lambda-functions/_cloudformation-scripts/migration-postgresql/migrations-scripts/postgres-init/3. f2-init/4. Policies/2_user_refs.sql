ALTER TABLE public.user_refs ENABLE ROW LEVEL SECURITY;

CREATE POLICY AccessUpdateSelfUserData ON public.user_refs AS PERMISSIVE FOR
UPDATE TO authenticated USING (
    (
        (
            SELECT
                user_role
            FROM
                user_refs
            WHERE
                (user_id=auth.uid ())
        )='super-admin'::text
    )
    OR (
        (
            (
                SELECT
                    user_role
                FROM
                    user_refs
                WHERE
                    (user_id=auth.uid ())
            )='admin'::text
        )
        AND (
            user_account_id IN (
                SELECT
                    user_account_id
                FROM
                    user_refs
                WHERE
                    (user_id=auth.uid ())
            )
        )
    )
    OR (
        (
            (
                SELECT
                    user_role
                FROM
                    user_refs
                WHERE
                    (user_id=auth.uid ())
            )='user'::text
        )
        AND (user_id=auth.uid ())
    )
);

CREATE POLICY AccessGetSelfUserData ON public.user_refs AS PERMISSIVE FOR
SELECT
    TO authenticated USING (true);