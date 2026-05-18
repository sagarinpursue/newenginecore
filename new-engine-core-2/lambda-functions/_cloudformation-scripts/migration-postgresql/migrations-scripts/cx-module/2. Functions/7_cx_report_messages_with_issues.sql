DROP FUNCTION IF EXISTS public.cx_report_messages_with_issues(text, text, timestamp with time zone, timestamp with time zone);

CREATE OR REPLACE FUNCTION cx_report_messages_with_issues(
    channel_filter TEXT,
    account_filter TEXT,
    p_start_date TIMESTAMPTZ,
    p_end_date TIMESTAMPTZ
)
RETURNS TABLE(
    message_id UUID,
    message_content TEXT,
    reason_type TEXT,
    reason_detail TEXT,
    created_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
AS $$
SELECT
    cm.chat_message_id,
    cm.content,
    'thumbs down' AS "reason_type",
    cmf.feedback_reason AS "reason_detail",
    cmf.created_at AS "created_at"
FROM chat_messages cm
         JOIN chatbot_sessions cs ON cs.session_id = cm.session_id
         JOIN chats ch ON cs.chat_id = ch.chat_id
         JOIN channels c ON ch.chat_id = c.chat_id
         JOIN accounts a ON ch.account_id = a.account_id
         JOIN chat_message_ratings cmr ON cmr.chat_message_id = cm.chat_message_id
         LEFT JOIN chat_message_feedbacks cmf ON cmf.chat_message_id = cm.chat_message_id
WHERE
    (channel_filter IS NULL OR channel_filter = 'all' OR c.name = channel_filter) AND
    (account_filter IS NULL OR account_filter = 'all' OR a.account_name_en = account_filter) AND
    cmr.rating = 'downvote' AND cs.created_at BETWEEN p_start_date AND p_end_date

UNION ALL

SELECT
    cm.chat_message_id,
    cm.content,
    'report' AS "reason_type",
    cmrp.report_reason AS "reason_detail",
    cmrp.created_at AS "created_at"
FROM chat_messages cm
         JOIN chatbot_sessions cs ON cs.session_id = cm.session_id
         JOIN chats ch ON cs.chat_id = ch.chat_id
         JOIN channels c ON ch.chat_id = c.chat_id
         JOIN accounts a ON ch.account_id = a.account_id
         JOIN chat_message_reports cmrp ON cmrp.chat_message_id = cm.chat_message_id
WHERE
    (channel_filter IS NULL OR channel_filter = 'all' OR c.name = channel_filter) AND
    (account_filter IS NULL OR account_filter = 'all' OR a.account_name_en = account_filter) AND
    cs.created_at BETWEEN p_start_date AND p_end_date;
$$;