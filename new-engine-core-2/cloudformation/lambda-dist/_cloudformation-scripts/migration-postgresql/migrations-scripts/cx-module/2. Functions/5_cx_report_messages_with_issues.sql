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
    reason_detail TEXT
)
LANGUAGE sql
SECURITY DEFINER
AS $$
SELECT
    cm.chat_message_id,
    cm.content,
    'thumbs down' AS "reason_type",
    cmf.feedback_reason AS "reason_detail"
FROM chat_messages cm
         JOIN chatbot_sessions cs ON cs.session_id = cm.session_id
         JOIN chat_message_ratings cmr ON cmr.chat_message_id = cm.chat_message_id
         LEFT JOIN chat_message_feedbacks cmf ON cmf.chat_message_id = cm.chat_message_id
WHERE cmr.rating = 'downvote' and cs.created_at BETWEEN p_start_date AND p_end_date

UNION ALL

SELECT
    cm.chat_message_id,
    cm.content,
    'report' AS "reason_type",
    cmrp.report_reason AS "reason_detail"
FROM chat_messages cm
         JOIN chatbot_sessions cs ON cs.session_id = cm.session_id
         JOIN chat_message_reports cmrp ON cmrp.chat_message_id = cm.chat_message_id
WHERE cs.created_at BETWEEN p_start_date AND p_end_date;
$$;