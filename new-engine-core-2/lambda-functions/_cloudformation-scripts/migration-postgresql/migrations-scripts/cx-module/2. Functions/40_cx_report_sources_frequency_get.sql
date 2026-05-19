CREATE OR REPLACE FUNCTION cx_report_sources_frequency_get(
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
    SELECT
        src.source_name AS source,
        COUNT(*)::BIGINT AS frequency
    FROM chat_messages cm
        JOIN chatbot_sessions cs ON cs.session_id = cm.session_id
        CROSS JOIN LATERAL unnest(cm.sources) AS src(source_name)
    WHERE
        cm.sources IS NOT NULL
        AND cm.created_at BETWEEN p_start_date AND p_end_date
        AND (channel_filter IS NULL OR channel_filter = 'all' OR cs.channel_id = channel_filter::uuid)
        AND (account_filter IS NULL OR account_filter = 'all' OR cs.account_id = account_filter::uuid)
        AND (
            search_filter IS NULL
            OR search_filter = ''
            OR src.source_name ILIKE '%' || search_filter || '%'
        )
    GROUP BY src.source_name
    ORDER BY frequency DESC
    LIMIT p_page_size
    OFFSET (p_page_number - 1) * p_page_size;
$$;
