-- Create content rule usage tracking table
CREATE TABLE IF NOT EXISTS "content_rule_usage" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "rule_id" uuid REFERENCES content_rules(id) ON DELETE CASCADE,
  "page_url" text,
  "client_id" text,
  "utm_source" text,
  "utm_medium" text,
  "utm_campaign" text,
  "utm_term" text,
  "utm_content" text,
  "timestamp" timestamptz DEFAULT now()
);

-- Create indexes for faster querying
CREATE INDEX IF NOT EXISTS "content_rule_usage_rule_id_idx" ON "content_rule_usage" ("rule_id");
CREATE INDEX IF NOT EXISTS "content_rule_usage_timestamp_idx" ON "content_rule_usage" ("timestamp");
CREATE INDEX IF NOT EXISTS "content_rule_usage_client_id_idx" ON "content_rule_usage" ("client_id");

-- Add RLS policies
ALTER TABLE "content_rule_usage" ENABLE ROW LEVEL SECURITY;

-- Only allow insert from edge functions (using service_role key)
CREATE POLICY "content_rule_usage_insert_policy"
ON "content_rule_usage"
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Only allow selection by authenticated users
CREATE POLICY "content_rule_usage_select_policy"
ON "content_rule_usage"
FOR SELECT
TO authenticated
USING (true);

-- Function to get content rule usage statistics
CREATE OR REPLACE FUNCTION get_content_rule_usage(
  from_date timestamptz,
  to_date timestamptz
)
RETURNS TABLE (
  rule_id uuid,
  rule_name text,
  usage_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
    SELECT 
      r.id as rule_id,
      r.name as rule_name,
      COUNT(u.id) as usage_count
    FROM 
      content_rules r
    LEFT JOIN 
      content_rule_usage u ON r.id = u.rule_id
    WHERE 
      (u.timestamp IS NULL OR (u.timestamp >= from_date AND u.timestamp <= to_date))
    GROUP BY 
      r.id, r.name
    ORDER BY 
      usage_count DESC;
END;
$$;

-- Update the UTM content function (utm-content) to track rule usage
-- This function should be updated in the Edge Function code 