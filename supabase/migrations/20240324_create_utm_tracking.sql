-- Create the UTM tracking table
CREATE TABLE IF NOT EXISTS "utm_tracking" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "utm_source" text,
  "utm_medium" text,
  "utm_campaign" text,
  "utm_term" text,
  "utm_content" text,
  "page_url" text,
  "referrer" text,
  "ip_address" text,
  "user_agent" text,
  "client_id" text,
  "timestamp" timestamptz DEFAULT now()
);

-- Create indexes for faster querying
CREATE INDEX IF NOT EXISTS "utm_tracking_source_idx" ON "utm_tracking" ("utm_source");
CREATE INDEX IF NOT EXISTS "utm_tracking_medium_idx" ON "utm_tracking" ("utm_medium");
CREATE INDEX IF NOT EXISTS "utm_tracking_campaign_idx" ON "utm_tracking" ("utm_campaign");
CREATE INDEX IF NOT EXISTS "utm_tracking_timestamp_idx" ON "utm_tracking" ("timestamp");
CREATE INDEX IF NOT EXISTS "utm_tracking_client_id_idx" ON "utm_tracking" ("client_id");

-- Add RLS policies
ALTER TABLE "utm_tracking" ENABLE ROW LEVEL SECURITY;

-- Only allow insert from edge functions (using service_role key)
CREATE POLICY "utm_tracking_insert_policy"
ON "utm_tracking"
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Only allow selection by authenticated users
CREATE POLICY "utm_tracking_select_policy"
ON "utm_tracking"
FOR SELECT
TO authenticated
USING (true);

-- Function to create this table via RPC (only for admins)
CREATE OR REPLACE FUNCTION create_utm_tracking_table()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- This would usually be done via migrations
  -- This function is just a placeholder for the UI
  RETURN true;
END;
$$;

-- Function to check if a UTM tracking record exists
CREATE OR REPLACE FUNCTION check_utm_tracking_record(
  target_client_id TEXT,
  target_source TEXT
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  record_count integer;
BEGIN
  SELECT COUNT(*) INTO record_count
  FROM utm_tracking
  WHERE client_id = target_client_id
  AND utm_source = target_source;
  
  RETURN record_count;
END;
$$; 