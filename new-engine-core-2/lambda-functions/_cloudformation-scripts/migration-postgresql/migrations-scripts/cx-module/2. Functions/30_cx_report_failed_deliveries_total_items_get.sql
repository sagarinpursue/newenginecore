CREATE OR REPLACE FUNCTION cx_report_failed_deliveries_total_items_get(
    channel_filter TEXT,
    account_filter TEXT,
    search_filter TEXT,
    p_start_date TIMESTAMPTZ,
    p_end_date TIMESTAMPTZ,
    p_page_size INT,
    p_page_number INT
)
RETURNS TABLE(
    count BIGINT
)
LANGUAGE sql
AS $$
    SELECT
        COUNT(*)
    FROM public.cx_360dialog_statuses
    WHERE
        (channel_filter IS NULL OR channel_filter = 'all' OR channel_id = channel_filter::uuid) AND
        (account_filter IS NULL OR account_filter = 'all' OR account_id = account_filter::uuid) AND
        (search_filter IS NULL OR search_filter = '' OR recipient_id ILIKE '%' || search_filter || '%' OR recipient_user_id ILIKE '%' || search_filter || '%') AND
        status IN ('failed', 'rejected') AND created_at BETWEEN p_start_date AND p_end_date
$$;
