CREATE OR REPLACE FUNCTION public.get_invoker()
RETURNS public.user_refs
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT * FROM user_refs WHERE user_id = auth.uid();
$$;
