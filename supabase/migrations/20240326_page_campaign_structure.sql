-- Create pages table
CREATE TABLE IF NOT EXISTS "pages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" text NOT NULL,
  "url" text NOT NULL,
  "description" text,
  "active" boolean DEFAULT true,
  "created_at" timestamptz DEFAULT now(),
  "updated_at" timestamptz DEFAULT now()
);

-- Create indexes for faster querying
CREATE INDEX IF NOT EXISTS "pages_name_idx" ON "pages" ("name");
CREATE INDEX IF NOT EXISTS "pages_url_idx" ON "pages" ("url");
CREATE INDEX IF NOT EXISTS "pages_active_idx" ON "pages" ("active");

-- Add RLS policies
ALTER TABLE "pages" ENABLE ROW LEVEL SECURITY;

-- Only allow authenticated users to manage pages
CREATE POLICY "pages_crud_policy"
ON "pages"
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Create campaigns table
CREATE TABLE IF NOT EXISTS "campaigns" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "page_id" uuid REFERENCES pages(id) ON DELETE CASCADE,
  "name" text NOT NULL,
  "type" text NOT NULL, -- Facebook, SEO, LinkedIn, Outbound, Custom, etc.
  "description" text,
  "active" boolean DEFAULT true,
  "created_at" timestamptz DEFAULT now(),
  "updated_at" timestamptz DEFAULT now()
);

-- Create indexes for faster querying
CREATE INDEX IF NOT EXISTS "campaigns_name_idx" ON "campaigns" ("name");
CREATE INDEX IF NOT EXISTS "campaigns_page_id_idx" ON "campaigns" ("page_id");
CREATE INDEX IF NOT EXISTS "campaigns_active_idx" ON "campaigns" ("active");
CREATE INDEX IF NOT EXISTS "campaigns_type_idx" ON "campaigns" ("type");

-- Add RLS policies
ALTER TABLE "campaigns" ENABLE ROW LEVEL SECURITY;

-- Only allow authenticated users to manage campaigns
CREATE POLICY "campaigns_crud_policy"
ON "campaigns"
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Modify content_rules table to add campaign_id
ALTER TABLE "content_rules" ADD COLUMN "campaign_id" uuid REFERENCES campaigns(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS "content_rules_campaign_id_idx" ON "content_rules" ("campaign_id");

-- Function to create a new page
CREATE OR REPLACE FUNCTION create_page(
  page_name text,
  page_url text,
  page_description text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_page_id uuid;
BEGIN
  INSERT INTO pages (name, url, description)
  VALUES (page_name, page_url, page_description)
  RETURNING id INTO new_page_id;
  
  RETURN new_page_id;
END;
$$;

-- Function to create a new campaign
CREATE OR REPLACE FUNCTION create_campaign(
  campaign_page_id uuid,
  campaign_name text,
  campaign_type text,
  campaign_description text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_campaign_id uuid;
BEGIN
  INSERT INTO campaigns (page_id, name, type, description)
  VALUES (campaign_page_id, campaign_name, campaign_type, campaign_description)
  RETURNING id INTO new_campaign_id;
  
  RETURN new_campaign_id;
END;
$$;

-- Function to create a new content rule with campaign_id
CREATE OR REPLACE FUNCTION create_content_rule_with_campaign(
  rule_name text,
  rule_description text,
  rule_selector text,
  rule_condition_type text,
  rule_condition_value text,
  rule_replacement_content text,
  rule_campaign_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_rule_id uuid;
BEGIN
  INSERT INTO content_rules (name, description, selector, condition_type, condition_value, replacement_content, campaign_id)
  VALUES (rule_name, rule_description, rule_selector, rule_condition_type, rule_condition_value, rule_replacement_content, rule_campaign_id)
  RETURNING id INTO new_rule_id;
  
  RETURN new_rule_id;
END;
$$; 