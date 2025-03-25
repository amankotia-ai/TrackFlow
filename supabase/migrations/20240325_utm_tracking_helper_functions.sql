-- Function to count UTM tracking records (for verification)
CREATE OR REPLACE FUNCTION count_utm_tracking_records()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  record_count integer;
BEGIN
  SELECT COUNT(*) INTO record_count
  FROM utm_tracking;
  
  RETURN record_count;
END;
$$;

-- Function to count content rule usage records (for verification)
CREATE OR REPLACE FUNCTION count_content_rule_usage_records()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  record_count integer;
BEGIN
  SELECT COUNT(*) INTO record_count
  FROM content_rule_usage;
  
  RETURN record_count;
END;
$$;

-- Function to check if most recent UTM tracking is within a time period (for checking if tracking is still active)
CREATE OR REPLACE FUNCTION check_recent_utm_tracking(hours_ago integer DEFAULT 24)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  has_recent_records boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM utm_tracking
    WHERE timestamp > (NOW() - (hours_ago * INTERVAL '1 hour'))
  ) INTO has_recent_records;
  
  RETURN has_recent_records;
END;
$$; 