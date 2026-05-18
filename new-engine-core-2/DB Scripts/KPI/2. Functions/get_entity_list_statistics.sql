CREATE OR REPLACE FUNCTION public.get_entity_list_statistics(start_date date, end_date date, selected_accounts json, page integer, page_size integer, search text)
 RETURNS json
 LANGUAGE plpgsql
AS $function$BEGIN
return (
  with
    filtered_accounts AS (
      SELECT
        accounts.*,
        count(*) as count_orders,
        count(*) FILTER (
          WHERE
            order_status = 'executed/complete'
        ) as count_completed_orders,
        count(*) FILTER (
          WHERE
            order_status = 'executed/complete'
            AND 
            orders.number_of_days > services.sla
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
        ) AS count_in_progress_orders
      FROM
        accounts
        left join orders ON (
          orders.account_id = accounts.account_id
          AND submission_date BETWEEN start_date AND end_date
        )
        left join services USING(service_code)
      WHERE
        (account_name_en ILIKE '%' || search || '%'
        OR account_name_ar ILIKE '%' || search || '%')
        AND (
          json_array_length(selected_accounts) = 0
          OR accounts.account_id = ANY (
            SELECT json_array_elements_text(selected_accounts)::UUID
          )
        )
      group by
        accounts.account_id,
        accounts.account_name_en,
        accounts.account_name_ar
    ),
    partition_accounts as (
      select
        *
      from
        filtered_accounts
      order by
        count_completed_orders desc
      offset
        page
      limit
        page_size
    )
  select
    json_build_object(
      'items',
      json_agg(
        json_build_object(
          'account_id', account_id,
          'account_name_en', account_name_en,
          'account_name_ar', account_name_ar,
          'count_services',
          (
            select
              count(service_id)
            from
              services
            where
              services.account_id = partition_accounts.account_id
          ),
          'count_completed_orders',
          count_completed_orders,
          'count_rejected_orders',
          count_rejected_orders,
          'count_returned_orders',
          count_returned_orders,
          'count_in_progress_orders',
          count_in_progress_orders,
          'count_exceeded_completed_orders',
          count_exceeded_completed_orders,
          'count_orders',
          count_orders          
        )
      ),
      'total_items',
      (SELECT count(account_id) from accounts)
    )
    
  from
    partition_accounts
);
END;$function$
;
