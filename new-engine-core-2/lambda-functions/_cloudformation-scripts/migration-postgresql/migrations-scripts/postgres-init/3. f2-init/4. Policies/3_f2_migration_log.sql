ALTER TABLE public.f2_migrations_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY AccessGetMigrationLogsData ON public.f2_migrations_log AS PERMISSIVE 
FOR SELECT TO postgres USING (true);