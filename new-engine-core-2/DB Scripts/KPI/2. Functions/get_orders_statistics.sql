CREATE OR REPLACE FUNCTION public.get_orders_statistics(start_date date, end_date date, selected_accounts json, selected_services json)
 RETURNS json
 LANGUAGE plpgsql
AS $function$BEGIN RETURN (
  WITH
    filtered_orders AS (
      SELECT
        COUNT(*) AS total_current_period,
        COUNT(*) FILTER (
          WHERE
            approval_dependencies IS TRUE
        ) AS approval_dependencies,
        COUNT(*) FILTER (
          WHERE
            order_status = 'executed/complete'
        ) AS completed,
        COUNT(*) FILTER (
          WHERE
            order_status = 'executed/complete'
            AND orders.number_of_days <= services.sla
        ) AS completed_within_sla,
        COUNT(*) FILTER (
          WHERE
            order_status = 'rejected'
        ) AS rejected,
        COUNT(*) FILTER (
          WHERE
            order_status = 'returned'
        ) AS returned,
        COUNT(*) FILTER (
          WHERE
            order_status = 'in_progress'
        ) AS in_progress,
        COUNT(*) FILTER (
          WHERE
            submission_channel = 'electronic'
        ) AS electronic_count,
        COUNT(*) FILTER (
          WHERE
            submission_channel = 'in-person'
        ) AS in_person_count,
        COUNT(*) FILTER (
          WHERE
            applicant_type IN ('individual/citizen', 'individual/resident')
        ) AS individual_count,
        COUNT(*) FILTER (
          WHERE
            applicant_type = 'business_owner'
        ) AS business_owner_count
      FROM
        orders
      JOIN services ON services.service_code = orders.service_code
        AND (
          json_array_length(selected_services) = 0
          OR services.service_id = ANY (
            SELECT
              json_array_elements_text(selected_services)::UUID
          )
        )
      WHERE
        submission_date BETWEEN start_date AND end_date
        AND (
          json_array_length(selected_accounts) = 0
          OR orders.account_id = ANY (
            SELECT
              json_array_elements_text(selected_accounts)::UUID
          )
        )
    )
  SELECT
    json_build_object(
      'total',
      total_current_period,
      'completed_within_sla',
      completed_within_sla,
      'completed',
      completed,
      'approval_dependencies',
      approval_dependencies,
      'rejected',
      rejected,
      'returned',
      returned, 
      'in_progress',
      in_progress,
      'electronic_count',
      electronic_count,
      'in_person_count',
      in_person_count,
      'individual_count',
      individual_count,
      'business_owner_count',
      business_owner_count
    )
  FROM
    filtered_orders
);

END$function$
;
