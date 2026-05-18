CREATE TABLE
    public.accounts (
        account_id uuid DEFAULT gen_random_uuid () NOT NULL,
        account_name_en text NULL,
        account_name_ar text NULL,
        account_code text NOT NULL,
        email_to_reminder text NULL,
        CONSTRAINT accounts_pkey PRIMARY KEY (account_id)
    );

INSERT INTO accounts (account_id, account_code, account_name_en)
VALUES ('00000000-0000-0000-0000-000000000000', 'ROOT', 'ROOT');