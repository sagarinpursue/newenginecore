CREATE OR REPLACE FUNCTION cx_report_other_questions_get(
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
    category TEXT,
    verdict TEXT,
    created_at TIMESTAMPTZ,
    account_name TEXT,
    channel_name TEXT
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT
        cma.question,
        cma.category,
        cma.verdict::TEXT,
        cma.created_at,
        ac.account_name_en,
        ch.name
    FROM chat_message_analysis cma
        LEFT JOIN accounts ac ON ac.account_id = cma.account_id
        LEFT JOIN channels ch ON ch.channel_id = cma.channel_id
    WHERE
        (channel_filter IS NULL OR channel_filter = 'all' OR cma.channel_id = channel_filter::uuid) AND
        (account_filter IS NULL OR account_filter = 'all' OR cma.account_id = account_filter::uuid) AND
        (search_filter IS NULL OR search_filter = '' OR cma.question ILIKE '%' || search_filter || '%') AND
        cma.category = 'other' AND cma.created_at BETWEEN p_start_date AND p_end_date
    ORDER BY cma.created_at DESC
    LIMIT p_page_size
    OFFSET (p_page_number - 1) * p_page_size;
$$;
