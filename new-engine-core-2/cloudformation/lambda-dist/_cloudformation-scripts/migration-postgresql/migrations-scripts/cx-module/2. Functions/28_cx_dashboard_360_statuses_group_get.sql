CREATE OR REPLACE FUNCTION cx_dashboard_360_statuses_group_get (
    p_start_date timestamptz,
    p_end_date timestamptz,
    p_timezone text DEFAULT 'UTC',
    channel_filter text DEFAULT 'all',
    account_filter text DEFAULT 'all'
)
RETURNS TABLE (
    day date,
    incoming_count bigint,
    outgoing_count bigint,
    delivered_count bigint,
    read_count bigint
)
LANGUAGE sql
STABLE
AS $$
    WITH days AS (
        SELECT gs::date AS d_date
        FROM generate_series(
            (p_start_date AT TIME ZONE p_timezone)::date,
            (p_end_date AT TIME ZONE p_timezone)::date,
            INTERVAL '1 day'
        ) AS gs
    ),

    incoming AS (
        SELECT
            (created_at AT TIME ZONE p_timezone)::date AS d_date,
            COUNT(DISTINCT message_id)::bigint AS cnt
        FROM public.cx_360dialog_statuses
        WHERE status = 'received'
            AND created_at BETWEEN p_start_date AND p_end_date
            AND (channel_filter = 'all' OR channel_id = channel_filter::uuid)
            AND (account_filter = 'all' OR account_id = account_filter::uuid)
        GROUP BY 1
    ),

    outgoing_messages AS (
        SELECT
            DISTINCT message_id,
            (created_at AT TIME ZONE p_timezone)::date AS d_date
        FROM public.cx_360dialog_statuses
        WHERE status IN ('accepted', 'rejected')
            AND created_at BETWEEN p_start_date AND p_end_date
            AND (channel_filter = 'all' OR channel_id = channel_filter::uuid)
            AND (account_filter = 'all' OR account_id = account_filter::uuid)
    ),

    outgoing AS (
        SELECT
            d_date,
            COUNT(*)::bigint AS cnt
        FROM outgoing_messages
        GROUP BY 1
    ),

    delivered AS (
        SELECT
            om.d_date,
            COUNT(*)::bigint AS cnt
        FROM outgoing_messages om
        WHERE EXISTS (
            SELECT 1
            FROM public.cx_360dialog_statuses cxds
            WHERE cxds.message_id = om.message_id
                AND cxds.status IN ('delivered', 'read')
        )
        GROUP BY 1
    ),

    read_stat AS (
        SELECT
            om.d_date,
            COUNT(*)::bigint AS cnt
        FROM outgoing_messages om
        WHERE EXISTS (
            SELECT 1
            FROM public.cx_360dialog_statuses cxds
            WHERE cxds.message_id = om.message_id
                AND cxds.status = 'read'
        )
        GROUP BY 1
    )

    SELECT
        days.d_date AS day,
        COALESCE(i.cnt, 0)::bigint AS incoming_count,
        COALESCE(o.cnt, 0)::bigint AS outgoing_count,
        COALESCE(d.cnt, 0)::bigint AS delivered_count,
        COALESCE(r.cnt, 0)::bigint AS read_count
    FROM days
        LEFT JOIN incoming i ON i.d_date = days.d_date
        LEFT JOIN outgoing o ON o.d_date = days.d_date
        LEFT JOIN delivered d ON d.d_date = days.d_date
        LEFT JOIN read_stat r ON r.d_date = days.d_date
    ORDER BY 1;
$$;
