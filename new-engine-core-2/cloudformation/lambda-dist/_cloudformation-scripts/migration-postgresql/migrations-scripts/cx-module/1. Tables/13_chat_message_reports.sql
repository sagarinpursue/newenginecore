CREATE TYPE public."chat_message_report_status_type" AS ENUM('pending', 'under_review', 'resolved', 'dismissed');

CREATE TABLE
    public.chat_message_reports (
        chat_message_report_id uuid DEFAULT gen_random_uuid () NOT NULL,
        report_reason text NOT NULL,
        report_details text NULL,
        report_status public."chat_message_report_status_type" DEFAULT 'pending'::chat_message_report_status_type NOT NULL,
        chat_message_id uuid NOT NULL,
        created_at timestamptz DEFAULT now() NOT NULL,
        updated_at timestamptz DEFAULT now() NOT NULL,
        resolved_at timestamptz NULL,
        CONSTRAINT chat_message_reports_chat_message_id_key UNIQUE (chat_message_id),
        CONSTRAINT chat_message_reports_pkey PRIMARY KEY (chat_message_report_id),
        CONSTRAINT chat_message_reports_chat_message_id_fkey FOREIGN KEY (chat_message_id) REFERENCES public.chat_messages (chat_message_id)
    );

ALTER TABLE public.chat_message_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY authAll ON public.chat_message_reports AS PERMISSIVE FOR ALL TO authenticated USING (true);

-- Table Triggers
create trigger "chat_message_reports-set_updated_at" before
update on public.chat_message_reports for each row
execute function set_updated_at ();