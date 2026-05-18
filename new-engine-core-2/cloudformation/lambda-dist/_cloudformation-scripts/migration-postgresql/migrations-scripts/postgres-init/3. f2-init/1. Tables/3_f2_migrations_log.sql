
CREATE TABLE IF NOT EXISTS
    public.f2_migrations_log (
        migration_hash_script text PRIMARY KEY,
        applied_at timestamptz DEFAULT now() NOT NULL
    );