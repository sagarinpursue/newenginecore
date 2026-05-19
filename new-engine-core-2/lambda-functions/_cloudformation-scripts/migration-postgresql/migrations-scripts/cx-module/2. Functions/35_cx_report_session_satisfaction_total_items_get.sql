CREATE OR REPLACE FUNCTION cx_report_session_satisfaction_total_items_get(
    channel_filter TEXT,
    account_filter TEXT,
    search_filter TEXT,
    p_start_date TIMESTAMPTZ,
    p_end_date TIMESTAMPTZ,
    p_page_size INT,
    p_page_number INT
)
RETURNS TABLE(count BIGINT)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT COUNT(*)::BIGINT
    FROM chat_session_ratings csr
        JOIN chatbot_sessions cs ON cs.session_id = csr.chat_session_id
        LEFT JOIN chat_session_feedbacks csf ON csf.chat_session_id = cs.session_id
    WHERE
        (channel_filter IS NULL OR channel_filter = 'all' OR cs.channel_id = channel_filter::uuid)
        AND (account_filter IS NULL OR account_filter = 'all' OR cs.account_id = account_filter::uuid)
        AND (
            search_filter IS NULL
            OR search_filter = ''
            OR COALESCE(csf.feedback_text, '') ILIKE '%' || search_filter || '%'
        )
        AND csr.created_at BETWEEN p_start_date AND p_end_date;
$$;
