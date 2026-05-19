CREATE OR REPLACE FUNCTION cx_report_faq_questions_total_items_get(
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
    SELECT COUNT(DISTINCT cma.question)::BIGINT
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
        );
$$;
