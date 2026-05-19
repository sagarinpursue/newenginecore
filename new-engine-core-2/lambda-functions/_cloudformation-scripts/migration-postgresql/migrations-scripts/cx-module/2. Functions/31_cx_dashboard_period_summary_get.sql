CREATE OR REPLACE FUNCTION cx_dashboard_period_summary_get(
    channel_filter TEXT,
    account_filter TEXT,
    p_start_date TIMESTAMPTZ,
    p_end_date TIMESTAMPTZ,
    p_timezone TEXT
)
RETURNS TABLE(
    distinct_user_count BIGINT,
    total_session_count BIGINT,
    message_session_count BIGINT,
    analysis_other_count BIGINT,
    active_session_time_sum BIGINT,
    chat_session_rating_count BIGINT,
    chat_session_rating_1_count BIGINT,
    chat_session_rating_2_count BIGINT,
    chat_session_rating_3_count BIGINT,
    chat_session_rating_4_count BIGINT,
    chat_session_rating_5_count BIGINT,
    total_upvote_message_count BIGINT,
    total_downvote_message_count BIGINT,
    total_neutral_message_count BIGINT,
    ai_response_message_count BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    WITH filtered_sessions AS (
        SELECT
            cs.session_id,
            cs.vendor_client_id,
            cs.created_at,
            COALESCE(EXTRACT(EPOCH FROM (cs.last_activity - cs.created_at)), 0)::BIGINT AS active_session_time
        FROM chatbot_sessions cs
        WHERE cs.created_at BETWEEN p_start_date AND p_end_date
          AND (channel_filter IS NULL OR channel_filter = 'all' OR cs.channel_id = channel_filter::uuid)
          AND (account_filter IS NULL OR account_filter = 'all' OR cs.account_id = account_filter::uuid)
    ),
    session_message_stats AS (
        SELECT
            cm.session_id,
            COUNT(cm.chat_message_id) AS total_message_count,
            COUNT(cm.chat_message_id) FILTER (WHERE cm.source = 'ai-agent') AS ai_message_count,
            COUNT(cm.chat_message_id) FILTER (WHERE cm.source = 'ai-agent' AND cmr.rating = 'upvote') AS upvote_count,
            COUNT(cm.chat_message_id) FILTER (WHERE cm.source = 'ai-agent' AND cmr.rating = 'downvote') AS downvote_count,
            COUNT(cm.chat_message_id) FILTER (WHERE cm.source = 'ai-agent' AND cmr.rating IS NULL) AS neutral_count
        FROM chat_messages cm
        JOIN filtered_sessions fs ON fs.session_id = cm.session_id
        LEFT JOIN chat_message_ratings cmr ON cmr.chat_message_id = cm.chat_message_id
        GROUP BY cm.session_id
    ),
    session_ratings AS (
        SELECT
            csr.chat_session_id AS session_id,
            COUNT(csr.rating) AS rating_count,
            MAX(csr.rating) AS max_rating
        FROM chat_session_ratings csr
        JOIN filtered_sessions fs ON fs.session_id = csr.chat_session_id
        GROUP BY csr.chat_session_id
    ),
    analysis_stats AS (
        SELECT COUNT(*) AS other_count
        FROM chat_message_analysis cma
        WHERE cma.category = 'other'
          AND cma.created_at BETWEEN p_start_date AND p_end_date
          AND (channel_filter IS NULL OR channel_filter = 'all' OR cma.channel_id = channel_filter::uuid)
          AND (account_filter IS NULL OR account_filter = 'all' OR cma.account_id = account_filter::uuid)
    ),
    session_base AS (
        SELECT
            fs.session_id,
            fs.vendor_client_id,
            fs.active_session_time,
            COALESCE(sms.total_message_count, 0) AS total_message_count,
            COALESCE(sms.ai_message_count, 0) AS ai_message_count,
            COALESCE(sms.upvote_count, 0) AS upvote_count,
            COALESCE(sms.downvote_count, 0) AS downvote_count,
            COALESCE(sms.neutral_count, 0) AS neutral_count,
            COALESCE(sr.rating_count, 0) AS rating_count,
            COALESCE(sr.max_rating, 0) AS max_rating
        FROM filtered_sessions fs
        LEFT JOIN session_message_stats sms ON sms.session_id = fs.session_id
        LEFT JOIN session_ratings sr ON sr.session_id = fs.session_id
    )
    SELECT
        COUNT(DISTINCT vendor_client_id) FILTER (WHERE vendor_client_id IS NOT NULL AND vendor_client_id <> '') AS distinct_user_count,
        COUNT(session_id) AS total_session_count,
        COUNT(*) FILTER (WHERE total_message_count > 0) AS message_session_count,
        (SELECT other_count FROM analysis_stats) AS analysis_other_count,
        COALESCE(SUM(active_session_time), 0) AS active_session_time_sum,
        COALESCE(SUM(rating_count), 0) AS chat_session_rating_count,
        COUNT(*) FILTER (WHERE max_rating = 1) AS chat_session_rating_1_count,
        COUNT(*) FILTER (WHERE max_rating = 2) AS chat_session_rating_2_count,
        COUNT(*) FILTER (WHERE max_rating = 3) AS chat_session_rating_3_count,
        COUNT(*) FILTER (WHERE max_rating = 4) AS chat_session_rating_4_count,
        COUNT(*) FILTER (WHERE max_rating = 5) AS chat_session_rating_5_count,
        COALESCE(SUM(upvote_count), 0) AS total_upvote_message_count,
        COALESCE(SUM(downvote_count), 0) AS total_downvote_message_count,
        COALESCE(SUM(neutral_count), 0) AS total_neutral_message_count,
        COALESCE(SUM(ai_message_count), 0) AS ai_response_message_count
    FROM session_base;
$$;
