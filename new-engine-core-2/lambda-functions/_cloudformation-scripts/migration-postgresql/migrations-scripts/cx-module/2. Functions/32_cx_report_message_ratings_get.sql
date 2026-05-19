CREATE OR REPLACE FUNCTION cx_report_message_ratings_get(
    channel_filter TEXT,
    account_filter TEXT,
    search_filter TEXT,
    p_start_date TIMESTAMPTZ,
    p_end_date TIMESTAMPTZ,
    p_page_size INT,
    p_page_number INT
)
RETURNS TABLE(
    message_id UUID,
    message_content TEXT,
    rating TEXT,
    created_at TIMESTAMPTZ,
    account_name TEXT,
    channel_name TEXT
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT
        cm.chat_message_id AS message_id,
        cm.content AS message_content,
        cmr.rating::TEXT AS rating,
        cm.created_at,
        ac.account_name_en AS account_name,
        ch.name AS channel_name
    FROM chat_messages cm
        JOIN chatbot_sessions cs ON cs.session_id = cm.session_id
        JOIN chat_message_ratings cmr ON cmr.chat_message_id = cm.chat_message_id
        LEFT JOIN accounts ac ON ac.account_id = cs.account_id
        LEFT JOIN channels ch ON ch.channel_id = cs.channel_id
    WHERE
        cm.source = 'ai-agent'
        AND cmr.rating IN ('upvote', 'downvote')
        AND (channel_filter IS NULL OR channel_filter = 'all' OR cs.channel_id = channel_filter::uuid)
        AND (account_filter IS NULL OR account_filter = 'all' OR cs.account_id = account_filter::uuid)
        AND (
            search_filter IS NULL
            OR search_filter = ''
            OR cm.content ILIKE '%' || search_filter || '%'
        )
        AND cm.created_at BETWEEN p_start_date AND p_end_date
    ORDER BY cm.created_at DESC
    LIMIT p_page_size
    OFFSET (p_page_number - 1) * p_page_size;
$$;
