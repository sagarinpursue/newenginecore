CREATE OR REPLACE FUNCTION cx_report_failed_deliveries_get(
    channel_filter TEXT,
    account_filter TEXT,
    search_filter TEXT,
    p_start_date TIMESTAMPTZ,
    p_end_date TIMESTAMPTZ,
    p_page_size INT,
    p_page_number INT
)
RETURNS TABLE(
    recipient_id TEXT,
    recipient_user_id TEXT,
    status TEXT,
    details JSONB,
    created_at TIMESTAMPTZ,
    account_name TEXT,
    channel_name TEXT
)
LANGUAGE sql
AS $$
    SELECT
        cxds.recipient_id,
        cxds.recipient_user_id,
        cxds.status,
        cxds.details,
        cxds.created_at,
        ac.account_name_en,
        ch.name
    FROM public.cx_360dialog_statuses cxds
        LEFT JOIN accounts ac ON ac.account_id = cxds.account_id
        LEFT JOIN channels ch ON ch.channel_id = cxds.channel_id
    WHERE
        (channel_filter IS NULL OR channel_filter = 'all' OR cxds.channel_id = channel_filter::uuid) AND
        (account_filter IS NULL OR account_filter = 'all' OR cxds.account_id = account_filter::uuid) AND
        (search_filter IS NULL OR search_filter = '' OR cxds.recipient_id ILIKE '%' || search_filter || '%' OR cxds.recipient_user_id ILIKE '%' || search_filter || '%') AND
        cxds.status IN ('failed', 'rejected') AND cxds.created_at BETWEEN p_start_date AND p_end_date
    ORDER BY cxds.created_at DESC
    LIMIT p_page_size
    OFFSET (p_page_number - 1) * p_page_size;
$$;
