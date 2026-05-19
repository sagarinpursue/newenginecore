CREATE OR REPLACE FUNCTION cx_report_faq_questions_get(
    channel_filter TEXT,
    account_filter TEXT,
    search_filter TEXT,
    p_start_date TIMESTAMPTZ,
    p_end_date TIMESTAMPTZ,
    p_page_size INT,
    p_page_number INT
)
RETURNS TABLE(
    question TEXT,
    source TEXT,
    satisfaction_pct NUMERIC,
    frequency BIGINT
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    WITH question_stats AS (
        SELECT
            cma.question,
            cma.question_id,
            COUNT(*) OVER (PARTITION BY cma.question) AS frequency
        FROM chat_message_analysis cma
        WHERE
            cma.category <> 'other'
            AND cma.verdict = 'success'
            AND cma.created_at BETWEEN p_start_date AND p_end_date
            AND (channel_filter IS NULL OR channel_filter = 'all' OR cma.channel_id = channel_filter::uuid)
            AND (account_filter IS NULL OR account_filter = 'all' OR cma.account_id = account_filter::uuid)
            AND (
                search_filter IS NULL
                OR search_filter = ''
                OR cma.question ILIKE '%' || search_filter || '%'
            )
    ),
    question_sources AS (
        SELECT
            qs.question,
            qs.frequency,
            (
                SELECT unnest(cm.sources)
                FROM chat_messages cm
                WHERE cm.chat_message_id = qs.question_id
                  AND cm.sources IS NOT NULL
                LIMIT 1
            ) AS source
        FROM question_stats qs
    ),
    rated AS (
        SELECT
            cma.question,
            COUNT(*) FILTER (WHERE cmr.rating = 'upvote') AS upvotes,
            COUNT(*) FILTER (WHERE cmr.rating IN ('upvote', 'downvote')) AS rated_count
        FROM chat_message_analysis cma
        JOIN chat_messages cm ON cm.chat_message_id = cma.answer_id
        LEFT JOIN chat_message_ratings cmr ON cmr.chat_message_id = cm.chat_message_id
        WHERE
            cma.category <> 'other'
            AND cma.created_at BETWEEN p_start_date AND p_end_date
            AND (channel_filter IS NULL OR channel_filter = 'all' OR cma.channel_id = channel_filter::uuid)
            AND (account_filter IS NULL OR account_filter = 'all' OR cma.account_id = account_filter::uuid)
        GROUP BY cma.question
    )
    SELECT
        qs.question,
        COALESCE(qs.source, '') AS source,
        CASE
            WHEN COALESCE(r.rated_count, 0) = 0 THEN 0
            ELSE ROUND((r.upvotes::NUMERIC / r.rated_count::NUMERIC) * 100, 1)
        END AS satisfaction_pct,
        MAX(qs.frequency)::BIGINT AS frequency
    FROM question_sources qs
    LEFT JOIN rated r ON r.question = qs.question
    GROUP BY qs.question, qs.source, r.upvotes, r.rated_count
    ORDER BY frequency DESC
    LIMIT p_page_size
    OFFSET (p_page_number - 1) * p_page_size;
$$;
