CREATE OR REPLACE FUNCTION cx_report_session_feedbacks_get(
    channel_filter TEXT,
    account_filter TEXT,
    p_start_date TIMESTAMPTZ,
    p_end_date TIMESTAMPTZ
)
RETURNS TABLE(
    feedback_text TEXT,
    feedback_rating TEXT,
    created_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
AS $$
SELECT
    csf.feedback_text,
    csr.rating,
    csf.created_at
FROM
    chat_session_feedbacks csf
        JOIN chatbot_sessions cs ON cs.session_id = csf.chat_session_id
        JOIN chats ch ON cs.chat_id = ch.chat_id
        JOIN channels c ON ch.chat_id = c.chat_id
        JOIN accounts a ON ch.account_id = a.account_id
        JOIN chat_session_ratings csr ON csr.chat_session_id = cs.session_id
WHERE
    (channel_filter IS NULL OR channel_filter = 'all' OR c.name = channel_filter) AND
    (account_filter IS NULL OR account_filter = 'all' OR a.account_name_en = account_filter) AND
    csr.rating <= 3 AND cs.created_at BETWEEN p_start_date AND p_end_date
$$;