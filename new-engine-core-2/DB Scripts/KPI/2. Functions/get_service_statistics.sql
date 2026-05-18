CREATE OR REPLACE FUNCTION public.get_service_statistics(start_date date, end_date date, selected_accounts json, selected_services json, page integer, page_size integer)
 RETURNS json
 LANGUAGE plpgsql
AS $function$BEGIN
RETURN (
  WITH
  filtered_orders AS (
    SELECT
      service_name_en,
      service_name_ar,
      MAX(orders.number_of_days) AS most_days,
      MIN(orders.number_of_days) AS fewest_days,
      AVG(orders.number_of_days)::INTEGER AS average_days,
      COUNT(*) AS total_orders,
      COUNT(*)  FILTER (
        WHERE
          order_status = 'executed/complete'
      ) as count_completed_orders,
      COUNT(*)  FILTER (
        WHERE
          order_status = 'executed/complete'
          AND orders.number_of_days > sla
      ) as count_exceeded_completed_orders,
       COUNT(*) FILTER (
          WHERE
            order_status = 'rejected'
        ) AS count_rejected_orders,
        COUNT(*) FILTER (
          WHERE
            order_status = 'returned'
        ) AS count_returned_orders,
        COUNT(*) FILTER (
          WHERE
            order_status = 'in_progress'
        ) AS count_in_progress_orders,
        COUNT(*) FILTER (
          WHERE
            approval_dependencies IS TRUE
        ) AS count_approval_dependencies,
      services.account_id,
      sla
    FROM
      orders
    JOIN
      services
    ON 
      services.service_code = orders.service_code
      AND (
        json_array_length(selected_accounts) = 0
        OR services.account_id = ANY (
          SELECT json_array_elements_text(selected_accounts)::UUID
      ))
      AND (
        json_array_length(selected_services) = 0
        OR services.service_id = ANY (
          SELECT json_array_elements_text(selected_services)::UUID
      ))
    WHERE
      submission_date BETWEEN start_date AND end_date
    GROUP BY
      services.service_code,
      services.account_id,
      service_name_en,
      service_name_ar,
      sla
  )
  SELECT
    JSON_AGG(
      JSON_BUILD_OBJECT(
        'account_id', filtered_orders.account_id,
        'service_name_en', service_name_en,
        'service_name_ar', service_name_ar,
        'total_orders', total_orders,
        'count_rejected_orders', count_rejected_orders,
        'count_returned_orders', count_returned_orders,
        'count_in_progress_orders', count_in_progress_orders,
        'count_completed_orders', count_completed_orders,
        'count_exceeded_completed_orders', count_exceeded_completed_orders,
        'count_approval_dependencies', count_approval_dependencies,
        'sla', sla,
        'most_days', most_days,
        'fewest_days', fewest_days,
        'average_days', average_days
      )
      ORDER BY
        (most_days - fewest_days) DESC, average_days DESC
    )
  FROM
    filtered_orders
);
END;$function$
;
