DROP FUNCTION IF EXISTS public.cx_dashboard_metrics_get(text, text, timestamp with time zone, timestamp with time zone);

CREATE OR REPLACE FUNCTION cx_dashboard_metrics_group_get(
    channel_filter TEXT,
    account_filter TEXT,
    p_start_date TIMESTAMPTZ,
    p_end_date TIMESTAMPTZ,
    p_timezone TEXT
)
RETURNS TABLE(
    day DATE,
    total_session_count BIGINT,
    message_session_count BIGINT,
    no_agent_message_session_count BIGINT,
    total_message_count BIGINT,
    user_input_message_count BIGINT,
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
    active_session_time_sum BIGINT,
    active_session_time_max BIGINT,
    active_session_time_min BIGINT,
    active_session_time_p50 BIGINT,
    active_session_time_p95 BIGINT,
    total_ai_response_time_sum NUMERIC,
    total_ai_response_time_count BIGINT,
    total_analysis_count BIGINT,
    analysis_fail_count BIGINT,
    analysis_wrong_count BIGINT,
    analysis_other_count BIGINT
)
LANGUAGE sql
STABLE
AS $$
    WITH filtered_sessions AS (
        SELECT session_id
        FROM chatbot_sessions
        WHERE created_at BETWEEN p_start_date AND p_end_date
          AND (channel_filter IS NULL OR channel_filter = 'all' OR channel_id = channel_filter::uuid)
          AND (account_filter IS NULL OR account_filter = 'all' OR account_id = account_filter::uuid)
    ),
    session_ratings_agg AS (
        SELECT
            csr.chat_session_id AS session_id,

            COUNT(csr.rating) AS chat_session_rating_count,
            COUNT(*) FILTER (WHERE csr.rating = '1') AS rating_1_count,
            COUNT(*) FILTER (WHERE csr.rating = '2') AS rating_2_count,
            COUNT(*) FILTER (WHERE csr.rating = '3') AS rating_3_count,
            COUNT(*) FILTER (WHERE csr.rating = '4') AS rating_4_count,
            COUNT(*) FILTER (WHERE csr.rating = '5') AS rating_5_count

        FROM chat_session_ratings csr
        JOIN filtered_sessions fs ON fs.session_id = csr.chat_session_id

        GROUP BY csr.chat_session_id
    ),
    message_agg AS (
        SELECT
            cm.session_id,
            COUNT(cm.chat_message_id) AS total_message_count,

            COUNT(cm.chat_message_id) FILTER (WHERE cm.source = 'client') AS user_message_count,
            COUNT(cm.chat_message_id) FILTER (WHERE cm.source = 'ai-agent') AS ai_message_count,
            COUNT(cm.chat_message_id) FILTER (WHERE cm.source = 'ai-agent' AND cmr.rating = 'upvote') AS upvote_count,
            COUNT(cm.chat_message_id) FILTER (WHERE cm.source = 'ai-agent' AND cmr.rating = 'downvote') AS downvote_count,
            COUNT(cm.chat_message_id) FILTER (WHERE cm.source = 'ai-agent' AND cmr.rating IS NULL) AS neutral_count,

            BOOL_OR(cmr.rating IN ('upvote','downvote')) AS has_feedback,
            SUM(
                EXTRACT(EPOCH FROM (cm.answered_at - cm.created_at))
            ) FILTER (
                WHERE cm.source = 'client' AND cm.answered_at IS NOT NULL
            ) AS ai_response_time_sum,
            COUNT(*) FILTER (WHERE cm.source = 'client' AND cm.answered_at IS NOT NULL) AS ai_response_time_count,

            COUNT(cma.question_id) AS total_analysis_count,
            COUNT(cma.question_id) FILTER (WHERE cma.verdict = 'fail') AS analysis_fail_count,
            COUNT(cma.question_id) FILTER (WHERE cma.verdict = 'wrong') AS analysis_wrong_count,
            COUNT(cma.question_id) FILTER (WHERE cma.category = 'other') AS analysis_other_count

        FROM chat_messages cm
        JOIN filtered_sessions fs ON fs.session_id = cm.session_id
        LEFT JOIN chat_message_ratings cmr ON cmr.chat_message_id = cm.chat_message_id
        LEFT JOIN chat_message_analysis cma ON cma.question_id = cm.chat_message_id

        GROUP BY cm.session_id
    ),
    base AS (
        SELECT
            cs.session_id,
            (cs.created_at AT TIME ZONE p_timezone)::date AS day,
            cs.was_escalated_to_live_agent,

            COALESCE(ma.total_message_count, 0) AS total_message_count,
            COALESCE(ma.user_message_count, 0) AS user_message_count,
            COALESCE(ma.ai_message_count, 0) AS ai_message_count,
            COALESCE(ma.upvote_count, 0) AS upvote_count,
            COALESCE(ma.downvote_count, 0) AS downvote_count,
            COALESCE(ma.neutral_count, 0) AS neutral_count,
            COALESCE(ma.has_feedback, FALSE) AS has_feedback,

            COALESCE(sra.chat_session_rating_count, 0) AS chat_session_rating_count,
            COALESCE(sra.rating_1_count, 0) AS rating_1_count,
            COALESCE(sra.rating_2_count, 0) AS rating_2_count,
            COALESCE(sra.rating_3_count, 0) AS rating_3_count,
            COALESCE(sra.rating_4_count, 0) AS rating_4_count,
            COALESCE(sra.rating_5_count, 0) AS rating_5_count,

            COALESCE(EXTRACT(EPOCH FROM (cs.last_activity - cs.created_at)), 0)::BIGINT AS active_session_time,

            ma.ai_response_time_sum,
            ma.ai_response_time_count,

            COALESCE(ma.total_analysis_count, 0) AS total_analysis_count,
            COALESCE(ma.analysis_fail_count, 0) AS analysis_fail_count,
            COALESCE(ma.analysis_wrong_count, 0) AS analysis_wrong_count,
            COALESCE(ma.analysis_other_count, 0) AS analysis_other_count

        FROM chatbot_sessions cs
        JOIN filtered_sessions fs ON fs.session_id = cs.session_id
        LEFT JOIN message_agg ma ON ma.session_id = cs.session_id
        LEFT JOIN session_ratings_agg sra ON sra.session_id = cs.session_id
    )

    SELECT
        day,

        COUNT(session_id) AS total_session_count,
        COUNT(*) FILTER (WHERE total_message_count > 0) AS message_session_count,
        COUNT(*) FILTER (WHERE total_message_count > 0 AND was_escalated_to_live_agent = FALSE) AS no_agent_message_session_count,

        SUM(total_message_count) AS total_message_count,
        SUM(user_message_count) AS user_input_message_count,
        SUM(ai_message_count) AS ai_response_message_count,

        SUM(upvote_count) AS total_upvote_message_count,
        SUM(downvote_count) AS total_downvote_message_count,
        SUM(neutral_count) AS total_neutral_message_count,
        COUNT(*) FILTER (WHERE has_feedback) AS sessions_with_feedback_count,

        SUM(chat_session_rating_count) AS chat_session_rating_count,
        SUM(rating_1_count) AS chat_session_rating_1_count,
        SUM(rating_2_count) AS chat_session_rating_2_count,
        SUM(rating_3_count) AS chat_session_rating_3_count,
        SUM(rating_4_count) AS chat_session_rating_4_count,
        SUM(rating_5_count) AS chat_session_rating_5_count,

        SUM(active_session_time) AS active_session_time_sum,
        MAX(active_session_time) AS active_session_time_max,
        COALESCE(MIN(NULLIF(active_session_time, 0)), 0) AS active_session_time_min,
        COALESCE(
            PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY NULLIF(active_session_time, 0))::BIGINT,
            0
        ) AS active_session_time_p50,
        COALESCE(
            PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY NULLIF(active_session_time, 0))::BIGINT,
            0
        ) AS active_session_time_p95,

        SUM(ai_response_time_sum) AS total_ai_response_time_sum,
        NULLIF(SUM(ai_response_time_count), 0) AS total_ai_response_time_count,

        SUM(total_analysis_count) AS total_analysis_count,
        SUM(analysis_fail_count) AS analysis_fail_count,
        SUM(analysis_wrong_count) AS analysis_wrong_count,
        SUM(analysis_other_count) AS analysis_other_count

    FROM base
    GROUP BY day
    ORDER BY day;
$$