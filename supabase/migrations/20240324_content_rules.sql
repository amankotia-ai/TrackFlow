-- Create content rules table
CREATE TABLE IF NOT EXISTS "content_rules" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" text NOT NULL,
  "description" text,
  "pattern" text NOT NULL,
  "content" text NOT NULL,
  "active" boolean DEFAULT true,
  "created_at" timestamptz DEFAULT now(),
  "updated_at" timestamptz DEFAULT now()
);

-- Create indexes for faster querying
CREATE INDEX IF NOT EXISTS "content_rules_name_idx" ON "content_rules" ("name");
CREATE INDEX IF NOT EXISTS "content_rules_active_idx" ON "content_rules" ("active");

-- Add RLS policies
ALTER TABLE "content_rules" ENABLE ROW LEVEL SECURITY;

-- Only allow authenticated users to manage content rules
CREATE POLICY "content_rules_crud_policy"
ON "content_rules"
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Function to create a new content rule
CREATE OR REPLACE FUNCTION create_content_rule(
  rule_name text,
  rule_description text,
  rule_pattern text,
  rule_content text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_rule_id uuid;
BEGIN
  INSERT INTO content_rules (name, description, pattern, content)
  VALUES (rule_name, rule_description, rule_pattern, rule_content)
  RETURNING id INTO new_rule_id;
  
  RETURN new_rule_id;
END;
$$; 