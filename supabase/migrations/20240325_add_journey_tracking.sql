-- Create journey_tracking table to track user journeys
CREATE TABLE IF NOT EXISTS public.journey_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id text NOT NULL,
  session_id text NOT NULL,
  journey_id text NOT NULL,
  previous_page_url text,
  page_url text NOT NULL,
  page_title text,
  page_sequence integer DEFAULT 1,
  time_on_previous_page integer, -- in milliseconds
  timestamp timestamptz DEFAULT now(),
  first_visit boolean DEFAULT false,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  created_at timestamptz DEFAULT now()
);

-- Create click_tracking table to track click positions and elements
CREATE TABLE IF NOT EXISTS public.click_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id text NOT NULL,
  session_id text NOT NULL,
  journey_id text NOT NULL,
  page_url text NOT NULL,
  x integer NOT NULL, -- x coordinate
  y integer NOT NULL, -- y coordinate
  element_selector text,
  element_text text,
  timestamp timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create mouse_tracking table to track mouse movements for heatmaps
CREATE TABLE IF NOT EXISTS public.mouse_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id text NOT NULL,
  session_id text NOT NULL,
  journey_id text NOT NULL,
  page_url text NOT NULL,
  coordinates jsonb NOT NULL, -- array of {x, y, timestamp} objects
  viewport_width integer,
  viewport_height integer,
  timestamp timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.journey_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.click_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mouse_tracking ENABLE ROW LEVEL SECURITY;

-- Allow anonymous insert but not select (for tracking)
CREATE POLICY "Allow anonymous inserts on journey_tracking"
  ON public.journey_tracking
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous inserts on click_tracking"
  ON public.click_tracking
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous inserts on mouse_tracking"
  ON public.mouse_tracking
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow authenticated users to select data
CREATE POLICY "Allow authenticated select on journey_tracking"
  ON public.journey_tracking
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated select on click_tracking"
  ON public.click_tracking
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated select on mouse_tracking"
  ON public.mouse_tracking
  FOR SELECT
  TO authenticated
  USING (true);

-- Create indexes for efficient querying
CREATE INDEX journey_tracking_client_id_idx ON public.journey_tracking(client_id);
CREATE INDEX journey_tracking_session_id_idx ON public.journey_tracking(session_id);
CREATE INDEX journey_tracking_journey_id_idx ON public.journey_tracking(journey_id);
CREATE INDEX journey_tracking_timestamp_idx ON public.journey_tracking(timestamp);

CREATE INDEX click_tracking_client_id_idx ON public.click_tracking(client_id);
CREATE INDEX click_tracking_page_url_idx ON public.click_tracking(page_url);
CREATE INDEX click_tracking_timestamp_idx ON public.click_tracking(timestamp);

CREATE INDEX mouse_tracking_page_url_idx ON public.mouse_tracking(page_url);
CREATE INDEX mouse_tracking_timestamp_idx ON public.mouse_tracking(timestamp);

-- Create function to get user journeys
CREATE OR REPLACE FUNCTION get_user_journeys(
  p_from_date timestamptz,
  p_to_date timestamptz,
  p_limit integer DEFAULT 100
)
RETURNS TABLE (
  journey_id text,
  client_id text,
  start_time timestamptz,
  end_time timestamptz,
  duration_seconds integer,
  page_count integer,
  pages jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH journeys AS (
    SELECT
      j.journey_id,
      j.client_id,
      MIN(j.timestamp) as start_time,
      MAX(j.timestamp) as end_time,
      COUNT(*) as page_count,
      jsonb_agg(
        jsonb_build_object(
          'page_url', j.page_url,
          'page_title', j.page_title,
          'page_sequence', j.page_sequence,
          'timestamp', j.timestamp,
          'time_on_page', j.time_on_previous_page
        )
        ORDER BY j.timestamp
      ) as pages
    FROM journey_tracking j
    WHERE j.timestamp BETWEEN p_from_date AND p_to_date
    GROUP BY j.journey_id, j.client_id
    ORDER BY start_time DESC
    LIMIT p_limit
  )
  SELECT
    j.journey_id,
    j.client_id,
    j.start_time,
    j.end_time,
    EXTRACT(EPOCH FROM (j.end_time - j.start_time))::integer as duration_seconds,
    j.page_count,
    j.pages
  FROM journeys j;
END;
$$; 