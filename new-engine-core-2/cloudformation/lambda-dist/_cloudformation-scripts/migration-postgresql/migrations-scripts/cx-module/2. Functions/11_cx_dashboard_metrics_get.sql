DROP FUNCTION IF EXISTS public.get_cx_dashboard_metrics(text, text, timestamp with time zone, timestamp with time zone);

CREATE OR REPLACE FUNCTION cx_dashboard_metrics_get(
    channel_filter TEXT,
    account_filter TEXT,
    p_start_date TIMESTAMPTZ,
    p_end_date TIMESTAMPTZ
)
RETURNS TABLE(
    total_session_count BIGINT,
    message_session_count BIGINT,
    no_agent_message_session_count BIGINT,
    total_message_count BIGINT,
    ai_response_message_count BIGINT,
    total_upvote_message_count BIGINT,
    total_downvote_message_count BIGINT,
    total_neutral_message_count BIGINT,
    sessions_with_feedback_count BIGINT,
    chat_session_rating_count BIGINT,
    chat_session_rating_1_count BIGINT,
    chat_session_rating_2_count BIGINT,
    chat_session_rating_3_count BIGINT,
    chat_session_rating_4_count BIGINT,
    chat_session_rating_5_count BIGINT,
    active_session_time_sum BIGINT
) AS $$
BEGIN
RETURN QUERY
    WITH filtered_sessions AS (
        SELECT
            cs.session_id,
            cs.was_escalated_to_live_agent,
            cs.created_at,
            cs.last_activity
        FROM chatbot_sessions cs
        WHERE
            (channel_filter IS NULL OR channel_filter = 'all' OR cs.channel_id = channel_filter::uuid) AND
            (account_filter IS NULL OR account_filter = 'all' OR cs.account_id = account_filter::uuid) AND
            cs.created_at BETWEEN p_start_date AND p_end_date
    ),
    all_messages AS (
        SELECT session_id, source FROM chat_messages WHERE session_id IN (SELECT session_id FROM filtered_sessions)
    ),
    ai_messages_with_ratings AS (
        SELECT
            cm.session_id,
            LOWER(TRIM(cmr.rating::TEXT)) as rating
        FROM chat_messages cm
        LEFT JOIN chat_message_ratings cmr ON cm.chat_message_id = cmr.chat_message_id
        WHERE cm.session_id IN (SELECT session_id FROM filtered_sessions) AND LOWER(TRIM(cm.source::TEXT)) = 'ai-agent'
    ),
    chat_session_ratings AS (
        SELECT
            csr.rating
        FROM filtered_sessions fs
        JOIN chat_session_ratings csr ON fs.session_id = csr.chat_session_id
    )
SELECT
    (SELECT COUNT(*) FROM filtered_sessions) AS total_session_count,
    (SELECT COUNT(DISTINCT session_id) FROM all_messages) AS message_session_count,
    (SELECT COUNT(DISTINCT am.session_id) FROM all_messages am JOIN filtered_sessions fs ON am.session_id = fs.session_id WHERE fs.was_escalated_to_live_agent = FALSE) AS no_agent_message_session_count,

    (SELECT COUNT(*) FROM all_messages) AS total_message_count,
    (SELECT COUNT(*) FROM ai_messages_with_ratings) AS ai_response_message_count,
    (SELECT COUNT(*) FROM ai_messages_with_ratings amwr WHERE amwr.rating = 'upvote') AS total_upvote_message_count,
    (SELECT COUNT(*) FROM ai_messages_with_ratings amwr WHERE amwr.rating = 'downvote') AS total_downvote_message_count,
    (SELECT COUNT(*) FROM ai_messages_with_ratings amwr WHERE amwr.rating IS NULL) AS total_neutral_message_count,

    (SELECT COUNT(DISTINCT amwr.session_id) FROM ai_messages_with_ratings amwr WHERE amwr.rating IN ('upvote', 'downvote')) AS sessions_with_feedback_count,

    (SELECT COUNT(*) FROM chat_session_ratings) AS chat_session_rating_count,
    (SELECT COUNT(*) FROM chat_session_ratings csr WHERE csr.rating = '1') AS chat_session_rating_1_count,
    (SELECT COUNT(*) FROM chat_session_ratings csr WHERE csr.rating = '2') AS chat_session_rating_2_count,
    (SELECT COUNT(*) FROM chat_session_ratings csr WHERE csr.rating = '3') AS chat_session_rating_3_count,
    (SELECT COUNT(*) FROM chat_session_ratings csr WHERE csr.rating = '4') AS chat_session_rating_4_count,
    (SELECT COUNT(*) FROM chat_session_ratings csr WHERE csr.rating = '5') AS chat_session_rating_5_count,

    (SELECT
        COALESCE(SUM(EXTRACT(EPOCH FROM (fs.last_activity - fs.created_at)))::BIGINT, 0)
    FROM
        filtered_sessions fs
    WHERE
        fs.last_activity IS NOT NULL
    AND fs.session_id IN (SELECT DISTINCT session_id FROM all_messages)
    ) AS active_session_time_sum;
END;
$$ LANGUAGE plpgsql;