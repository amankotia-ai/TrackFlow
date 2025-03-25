-- Migration to update the utm_tracking table with new fields

-- Add the new fields to the utm_tracking table
ALTER TABLE "utm_tracking" 
  ADD COLUMN IF NOT EXISTS "first_visit" boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS "is_direct" boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS "session_id" text,
  ADD COLUMN IF NOT EXISTS "visit_count" integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "event_type" text DEFAULT 'pageview',
  ADD COLUMN IF NOT EXISTS "page_title" text,
  ADD COLUMN IF NOT EXISTS "screen_width" integer,
  ADD COLUMN IF NOT EXISTS "screen_height" integer,
  ADD COLUMN IF NOT EXISTS "browser_language" text,
  ADD COLUMN IF NOT EXISTS "first_utm_source" text,
  ADD COLUMN IF NOT EXISTS "first_utm_medium" text,
  ADD COLUMN IF NOT EXISTS "first_utm_campaign" text,
  ADD COLUMN IF NOT EXISTS "first_utm_term" text,
  ADD COLUMN IF NOT EXISTS "first_utm_content" text,
  ADD COLUMN IF NOT EXISTS "last_utm_source" text,
  ADD COLUMN IF NOT EXISTS "last_utm_medium" text,
  ADD COLUMN IF NOT EXISTS "last_utm_campaign" text,
  ADD COLUMN IF NOT EXISTS "last_utm_term" text,
  ADD COLUMN IF NOT EXISTS "last_utm_content" text,
  ADD COLUMN IF NOT EXISTS "event_name" text;

-- Create indexes for new fields
CREATE INDEX IF NOT EXISTS "utm_tracking_event_type_idx" ON "utm_tracking" ("event_type");
CREATE INDEX IF NOT EXISTS "utm_tracking_session_id_idx" ON "utm_tracking" ("session_id");
CREATE INDEX IF NOT EXISTS "utm_tracking_first_visit_idx" ON "utm_tracking" ("first_visit");

-- Update the check_utm_tracking_record function to work with the new schema
CREATE OR REPLACE FUNCTION check_utm_tracking_record(
  target_client_id TEXT,
  target_source TEXT DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  record_count integer;
BEGIN
  IF target_source IS NOT NULL THEN
    SELECT COUNT(*) INTO record_count
    FROM utm_tracking
    WHERE client_id = target_client_id
    AND (utm_source = target_source OR last_utm_source = target_source OR first_utm_source = target_source);
  ELSE
    SELECT COUNT(*) INTO record_count
    FROM utm_tracking
    WHERE client_id = target_client_id;
  END IF;
  
  RETURN record_count;
END;
$$;

-- Create function to get visitor metrics
CREATE OR REPLACE FUNCTION get_visitor_metrics(
  from_date TIMESTAMPTZ DEFAULT '2000-01-01'::TIMESTAMPTZ,
  to_date TIMESTAMPTZ DEFAULT '2099-12-31'::TIMESTAMPTZ
)
RETURNS TABLE (
  total_visits bigint,
  unique_visitors bigint,
  new_visitors bigint,
  returning_visitors bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH visitors AS (
    SELECT 
      client_id,
      COUNT(*) as visit_count,
      SUM(CASE WHEN first_visit = true THEN 1 ELSE 0 END) as is_new
    FROM utm_tracking
    WHERE timestamp >= from_date AND timestamp <= to_date
    GROUP BY client_id
  )
  SELECT
    (SELECT COUNT(*) FROM utm_tracking WHERE timestamp >= from_date AND timestamp <= to_date) as total_visits,
    COUNT(*) as unique_visitors,
    SUM(CASE WHEN is_new > 0 THEN 1 ELSE 0 END) as new_visitors,
    SUM(CASE WHEN is_new = 0 THEN 1 ELSE 0 END) as returning_visitors
  FROM visitors;
END;
$$; 