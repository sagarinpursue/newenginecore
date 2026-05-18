DROP FUNCTION IF EXISTS public.cx_report_messages_with_issues_get(text, text, timestamp with time zone, timestamp with time zone, int, int);

CREATE OR REPLACE FUNCTION cx_report_messages_feedbacks_get(
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
    reason_type TEXT,
    reason_detail TEXT,
    created_at TIMESTAMPTZ,
    account_name TEXT,
    channel_name TEXT
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT
        message_id,
        message_content,
        reason_type,
        reason_detail,
        created_at,
        account_name,
        channel_name
    FROM (
        SELECT
            cm.chat_message_id AS message_id,
            cm.content AS message_content,
            'thumbs down' AS "reason_type",
            cmf.feedback_reason AS "reason_detail",
            cmf.created_at AS "created_at",
            ac.account_name_en AS account_name,
            ch.name AS channel_name
        FROM chat_messages cm
            JOIN chatbot_sessions cs ON cs.session_id = cm.session_id
            JOIN chat_message_ratings cmr ON cmr.chat_message_id = cm.chat_message_id
            LEFT JOIN chat_message_feedbacks cmf ON cmf.chat_message_id = cm.chat_message_id
            LEFT JOIN accounts ac ON ac.account_id = cs.account_id
            LEFT JOIN channels ch ON ch.channel_id = cs.channel_id
        WHERE
            (channel_filter IS NULL OR channel_filter = 'all' OR cs.channel_id = channel_filter::uuid) AND
            (account_filter IS NULL OR account_filter = 'all' OR cs.account_id = account_filter::uuid) AND
            (search_filter IS NULL OR search_filter = '' OR cm.content ILIKE '%' || search_filter || '%') AND
            cmr.rating = 'downvote' AND cmf.created_at BETWEEN p_start_date AND p_end_date

        UNION ALL

        SELECT
            cm.chat_message_id AS message_id,
            cm.content AS message_content,
            'report' AS "reason_type",
            cmrp.report_reason AS "reason_detail",
            cmrp.created_at AS "created_at",
            ac.account_name_en AS account_name,
            ch.name AS channel_name
        FROM chat_messages cm
            JOIN chatbot_sessions cs ON cs.session_id = cm.session_id
            JOIN chat_message_reports cmrp ON cmrp.chat_message_id = cm.chat_message_id
            LEFT JOIN accounts ac ON ac.account_id = cs.account_id
            LEFT JOIN channels ch ON ch.channel_id = cs.channel_id
        WHERE
            (channel_filter IS NULL OR channel_filter = 'all' OR cs.channel_id = channel_filter::uuid) AND
            (account_filter IS NULL OR account_filter = 'all' OR cs.account_id = account_filter::uuid) AND
            (search_filter IS NULL OR search_filter = '' OR cm.content ILIKE '%' || search_filter || '%') AND
            cmrp.created_at BETWEEN p_start_date AND p_end_date
    ) AS combined_results

    ORDER BY created_at DESC
    LIMIT p_page_size
    OFFSET (p_page_number - 1) * p_page_size;
$$;
