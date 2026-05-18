CREATE TABLE public.cx_360dialog_statuses (
    status_id uuid DEFAULT gen_random_uuid () NOT NULL PRIMARY KEY,
    channel_id uuid NOT NULL,
    account_id uuid NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    message_id text NOT NULL,
    status text NOT NULL,
    timestamp text NULL,
    type text NULL,
    recipient_name text NULL,
    recipient_id text NULL,
    recipient_user_id text NULL,
    details jsonb NULL
);

CREATE INDEX cx_360dialog_statuses_status_created_at_idx
    ON public.cx_360dialog_statuses (status, created_at);

CREATE INDEX cx_360dialog_statuses_account_id_status_created_at_idx
    ON public.cx_360dialog_statuses (account_id, status, created_at);

CREATE INDEX cx_360dialog_statuses_channel_id_status_created_at_idx
    ON public.cx_360dialog_statuses (channel_id, status, created_at);

CREATE INDEX cx_360dialog_statuses_message_id_status_idx
    ON public.cx_360dialog_statuses (message_id, status);

ALTER TABLE public.cx_360dialog_statuses ENABLE ROW LEVEL SECURITY;

CREATE POLICY authSelect ON public.cx_360dialog_statuses AS PERMISSIVE FOR SELECT TO authenticated
    USING (
        (get_invoker()).user_account_id = '00000000-0000-0000-0000-000000000000'::uuid
        OR
        (get_invoker()).user_account_id = account_id
    );
