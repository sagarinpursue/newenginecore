CREATE OR REPLACE FUNCTION cx_report_top_sources_get(
    channel_filter TEXT,
    account_filter TEXT,
    search_filter TEXT,
    p_start_date TIMESTAMPTZ,
    p_end_date TIMESTAMPTZ,
    p_page_size INT,
    p_page_number INT
)
RETURNS TABLE(
    source TEXT,
    frequency BIGINT
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT source, frequency
    FROM cx_report_sources_frequency_get(
        channel_filter,
        account_filter,
        search_filter,
        p_start_date,
        p_end_date,
        1,
        1
    )
    LIMIT 1;
$$;
