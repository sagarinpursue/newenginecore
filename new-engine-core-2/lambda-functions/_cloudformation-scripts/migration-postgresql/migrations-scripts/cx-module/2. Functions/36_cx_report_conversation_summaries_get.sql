CREATE OR REPLACE FUNCTION cx_report_conversation_summaries_get(
    channel_filter TEXT,
    account_filter TEXT,
    search_filter TEXT,
    p_start_date TIMESTAMPTZ,
    p_end_date TIMESTAMPTZ,
    p_page_size INT,
    p_page_number INT
)
RETURNS TABLE(
    topic TEXT,
    path TEXT,
    summary TEXT,
    name TEXT,
    channel_name TEXT,
    created_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    WITH latest_analysis AS (
        SELECT DISTINCT ON (cma.session_id)
            cma.session_id,
            cma.category AS topic,
            LEFT(cma.answer, 500) AS summary,
            cma.created_at,
            cma.account_id,
            cma.channel_id
        FROM chat_message_analysis cma
        WHERE
            cma.category <> 'other'
            AND cma.created_at BETWEEN p_start_date AND p_end_date
            AND (channel_filter IS NULL OR channel_filter = 'all' OR cma.channel_id = channel_filter::uuid)
            AND (account_filter IS NULL OR account_filter = 'all' OR cma.account_id = account_filter::uuid)
            AND (
                search_filter IS NULL
                OR search_filter = ''
                OR cma.question ILIKE '%' || search_filter || '%'
                OR cma.answer ILIKE '%' || search_filter || '%'
                OR cma.category ILIKE '%' || search_filter || '%'
            )
        ORDER BY cma.session_id, cma.created_at DESC
    ),
    latest_sources AS (
        SELECT DISTINCT ON (cm.session_id)
            cm.session_id,
            array_to_string(cm.sources, ' ← ') AS path
        FROM chat_messages cm
        WHERE cm.source = 'ai-agent' AND cm.sources IS NOT NULL
        ORDER BY cm.session_id, cm.created_at DESC
    )
    SELECT
        la.topic,
        COALESCE(ls.path, '') AS path,
        la.summary,
        COALESCE(ac.account_name_en, LEFT(cs.vendor_client_id, 8)) AS name,
        ch.name AS channel_name,
        la.created_at
    FROM latest_analysis la
        JOIN chatbot_sessions cs ON cs.session_id = la.session_id
        LEFT JOIN latest_sources ls ON ls.session_id = la.session_id
        LEFT JOIN accounts ac ON ac.account_id = la.account_id
        LEFT JOIN channels ch ON ch.channel_id = la.channel_id
    ORDER BY la.created_at DESC
    LIMIT p_page_size
    OFFSET (p_page_number - 1) * p_page_size;
$$;
