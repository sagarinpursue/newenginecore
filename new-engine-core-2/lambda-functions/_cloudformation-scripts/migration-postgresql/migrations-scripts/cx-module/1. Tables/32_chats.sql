DROP POLICY IF EXISTS authAll ON public.chats;

CREATE POLICY authAll ON public.chats AS PERMISSIVE FOR ALL TO authenticated
USING (
    (get_invoker()).user_account_id = '00000000-0000-0000-0000-000000000000'::uuid
    OR
    (get_invoker()).user_account_id = account_id
);
