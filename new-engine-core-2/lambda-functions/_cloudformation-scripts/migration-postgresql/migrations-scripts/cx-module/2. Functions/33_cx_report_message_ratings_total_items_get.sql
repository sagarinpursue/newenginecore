CREATE OR REPLACE FUNCTION cx_report_message_ratings_total_items_get(
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
    FROM chat_messages cm
        JOIN chatbot_sessions cs ON cs.session_id = cm.session_id
        JOIN chat_message_ratings cmr ON cmr.chat_message_id = cm.chat_message_id
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
        AND cm.created_at BETWEEN p_start_date AND p_end_date;
$$;
