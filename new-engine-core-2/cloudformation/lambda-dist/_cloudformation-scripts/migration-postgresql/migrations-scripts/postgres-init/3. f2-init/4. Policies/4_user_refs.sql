DROP POLICY IF EXISTS AccessUpdateSelfUserData ON public.user_refs;
DROP POLICY IF EXISTS AccessGetSelfUserData ON public.user_refs;

CREATE POLICY authSelect ON public.user_refs AS PERMISSIVE FOR SELECT TO authenticated
USING (
    (get_invoker()).user_account_id = '00000000-0000-0000-0000-000000000000'::uuid
    OR
    (get_invoker()).user_account_id = user_account_id
);

CREATE POLICY authUpdate ON public.user_refs AS PERMISSIVE FOR UPDATE TO authenticated
USING (
    user_id=auth.uid()
    OR
    (get_invoker()).user_role = 'super_admin'
    OR
    ((get_invoker()).user_role = 'admin' AND (
        (get_invoker()).user_account_id = '00000000-0000-0000-0000-000000000000'::uuid
        OR
        (get_invoker()).user_account_id = user_account_id
    ))
)
WITH CHECK  (
    EXISTS (
        SELECT 1 FROM public.user_refs as original
        WHERE original.user_id = user_refs.user_id
        AND original.user_name = user_refs.user_name
        AND original.user_role = user_refs.user_role
        AND original.user_account_id = user_refs.user_account_id
    )
)
