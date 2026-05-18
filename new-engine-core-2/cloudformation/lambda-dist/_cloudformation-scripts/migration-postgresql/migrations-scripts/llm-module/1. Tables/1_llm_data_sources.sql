CREATE TYPE llm_data_source_type AS ENUM('S3', 'WEB');

CREATE TYPE public."llm_data_source_status" AS ENUM('CREATING', 'ACTIVE', 'FAILED');

CREATE TABLE
    public.llm_data_sources (
        llm_data_source_id uuid DEFAULT gen_random_uuid () NOT NULL,
        user_id uuid NOT NULL,
        account_id uuid NOT NULL,
        created_at timestamptz DEFAULT now() NOT NULL,
        updated_at timestamptz DEFAULT now() NOT NULL,
        "name" varchar NOT NULL,
        chunking_strategy varchar NOT NULL,
        chunk_size int4 NOT NULL,
        embeddings_model varchar NOT NULL,
        knowledge_base_id varchar NULL,
        data_source_id varchar NULL,
        ingestion_job_id varchar NULL,
        opensearch_index varchar NULL,
        s3_folder varchar NULL,
        url varchar NULL,
        "type" public."llm_data_source_type" NOT NULL,
        status public."llm_data_source_status" DEFAULT 'CREATING'::llm_data_source_status NOT NULL,
        collection_id varchar NULL,
        is_imported bool DEFAULT false NOT NULL,
        CONSTRAINT llm_data_sources_pkey PRIMARY KEY (llm_data_source_id),
        CONSTRAINT llm_data_sources_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts (account_id),
        CONSTRAINT llm_data_sources_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_refs (user_id) ON DELETE RESTRICT
    );

ALTER TABLE public.llm_data_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY auth ON public.llm_data_sources USING (
    (
        EXISTS (
            SELECT
                1
            FROM
                user_refs
            WHERE
                (
                    (user_refs.user_id=auth.uid ())
                    AND (
                        (user_refs.user_account_id=llm_data_sources.account_id)
                        OR (user_refs.user_account_id='00000000-0000-0000-0000-000000000000'::uuid)
                    )
                )
        )
    )
)
WITH
    CHECK (
        (
            EXISTS (
                SELECT
                    1
                FROM
                    user_refs
                WHERE
                    (
                        (user_refs.user_id=auth.uid ())
                        AND (
                            (user_refs.user_account_id=llm_data_sources.account_id)
                            OR (user_refs.user_account_id='00000000-0000-0000-0000-000000000000'::uuid)
                        )
                    )
            )
        )
    );

-- Table Triggers
create trigger "llm_data_sources-set_updated_at" before
update on public.llm_data_sources for each row
execute function set_updated_at ();