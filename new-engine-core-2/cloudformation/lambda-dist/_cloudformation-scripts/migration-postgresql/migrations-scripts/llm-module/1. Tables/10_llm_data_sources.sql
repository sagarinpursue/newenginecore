CREATE TYPE llm_data_source_destination_type AS ENUM('S3', 'OpenSearch');

ALTER TABLE public.llm_data_sources
    DROP COLUMN opensearch_index,
    ADD COLUMN IF NOT EXISTS vector_bucket_name VARCHAR NULL,
    ADD COLUMN IF NOT EXISTS destination_type public.llm_data_source_destination_type NOT NULL DEFAULT 'OpenSearch';
