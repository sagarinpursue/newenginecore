CREATE OR REPLACE FUNCTION cx_report_session_satisfaction_get(
    channel_filter TEXT,
    account_filter TEXT,
    search_filter TEXT,
    p_start_date TIMESTAMPTZ,
    p_end_date TIMESTAMPTZ,
    p_page_size INT,
    p_page_number INT
)
RETURNS TABLE(
    feedback_text TEXT,
    feedback_rating INT,
    created_at TIMESTAMPTZ,
    account_name TEXT,
    channel_name TEXT
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT
        COALESCE(csf.feedback_text, '') AS feedback_text,
        csr.rating::INT AS feedback_rating,
        csr.created_at,
        ac.account_name_en AS account_name,
        ch.name AS channel_name
    FROM chat_session_ratings csr
        JOIN chatbot_sessions cs ON cs.session_id = csr.chat_session_id
        LEFT JOIN chat_session_feedbacks csf ON csf.chat_session_id = cs.session_id
        LEFT JOIN accounts ac ON ac.account_id = cs.account_id
        LEFT JOIN channels ch ON ch.channel_id = cs.channel_id
    WHERE
        (channel_filter IS NULL OR channel_filter = 'all' OR cs.channel_id = channel_filter::uuid)
        AND (account_filter IS NULL OR account_filter = 'all' OR cs.account_id = account_filter::uuid)
        AND (
            search_filter IS NULL
            OR search_filter = ''
            OR COALESCE(csf.feedback_text, '') ILIKE '%' || search_filter || '%'
        )
        AND csr.created_at BETWEEN p_start_date AND p_end_date
    ORDER BY csr.created_at DESC
    LIMIT p_page_size
    OFFSET (p_page_number - 1) * p_page_size;
$$;
