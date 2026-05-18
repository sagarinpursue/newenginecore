-- NOTE: change to your own passwords for production environments
ALTER USER authenticator
WITH
    PASSWORD '${PASSWORD}';

ALTER USER supabase_auth_admin
WITH
    PASSWORD '${PASSWORD}';

ALTER USER supabase_storage_admin
WITH
    PASSWORD '${PASSWORD}';