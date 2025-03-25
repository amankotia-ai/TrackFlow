# Journey Tracking Setup

This document outlines the database structure and implementation required for advanced user journey tracking in UTM Content Magic.

## Overview

The journey tracking system allows you to:

1. Track UTM parameters across user sessions
2. Follow user journeys through your website
3. Track user interactions (clicks, form submissions, and scrolls)
4. Visualize user paths and key interaction points

## Database Structure

The tracking data is stored in multiple tables in your Supabase database:

- `utm_tracking`: Core table storing basic visit data with UTM parameters
- `journey_data`: Tracks user journeys between pages
- `click_data`: Records user clicks on elements
- `form_data`: Captures form submission events
- `scroll_data`: Tracks scroll depth and section visibility

## Data Model

### UTM Tracking Table
```sql
CREATE TABLE IF NOT EXISTS utm_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  page_url TEXT NOT NULL,
  page_title TEXT,
  referrer TEXT,
  ip_address TEXT,
  user_agent TEXT,
  client_id TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT now(),
  first_visit BOOLEAN DEFAULT FALSE,
  is_direct BOOLEAN DEFAULT FALSE,
  session_id TEXT,
  visit_count INTEGER DEFAULT 1,
  event_type TEXT DEFAULT 'pageview',
  event_name TEXT,
  browser_language TEXT,
  screen_width INTEGER,
  screen_height INTEGER
);
```

### Journey Data Table
```sql
CREATE TABLE IF NOT EXISTS journey_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  journey_id TEXT NOT NULL,
  page_url TEXT NOT NULL,
  page_title TEXT,
  previous_page_url TEXT,
  page_sequence INTEGER,
  time_on_previous_page INTEGER,
  event_type TEXT DEFAULT 'pageview',
  timestamp TIMESTAMPTZ DEFAULT now(),
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT
);
```

### Click Data Table
```sql
CREATE TABLE IF NOT EXISTS click_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  journey_id TEXT NOT NULL,
  page_url TEXT NOT NULL,
  x INTEGER NOT NULL,
  y INTEGER NOT NULL,
  element_selector TEXT,
  element_text TEXT,
  element_href TEXT,
  element_tag TEXT,
  element_section JSON,
  timestamp TIMESTAMPTZ DEFAULT now()
);
```

### Form Data Table
```sql
CREATE TABLE IF NOT EXISTS form_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  journey_id TEXT NOT NULL,
  page_url TEXT NOT NULL,
  form_id TEXT,
  form_action TEXT,
  form_fields JSONB,
  timestamp TIMESTAMPTZ DEFAULT now()
);
```

### Scroll Data Table
```sql
CREATE TABLE IF NOT EXISTS scroll_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  journey_id TEXT NOT NULL,
  page_url TEXT NOT NULL,
  scroll_depth INTEGER NOT NULL,
  section_id TEXT,
  section_visibility FLOAT,
  timestamp TIMESTAMPTZ DEFAULT now()
);
```

## Key Concepts

### Client ID
A persistent identifier stored in localStorage that identifies a unique visitor across multiple sessions.

### Session ID
A temporary identifier stored in sessionStorage that groups activities within a single browser session.

### Journey ID
Identifies a single journey through your website, starting when a user first arrives and ending when they leave or are inactive for a set period (30 minutes by default).

## Implementation

1. The tracking script is added to the client's website
2. User interactions are captured in the browser
3. Data is sent to a Supabase Edge Function
4. The Edge Function validates and stores the data in the appropriate tables
5. The UTM Content Magic dashboard retrieves and visualizes this data

## Privacy Considerations

- No personally identifiable information (PII) is collected
- Form field values are never captured, only field names and types
- Client IDs are randomly generated UUIDs that cannot be tied to personal identity
- IP addresses are stored temporarily for geolocation purposes only
- Data retention policies should be implemented based on regulatory requirements

## Important Note:

The tracking script should be added to your **target website** (the site where you implement UTM content replacements), not to the UTM Content Magic admin panel itself.

## Setup Steps

### 1. Database Setup

Run the database migration to create the necessary tables:

```bash
npx supabase migration up
```

This will create the following tables:
- `journey_tracking`: Records page visits and user journeys
- `click_tracking`: Records click locations and elements
- `mouse_tracking`: Records mouse movement coordinates for heatmaps

### 2. Deploy the Tracking Function

The tracking function handles all data collection. There are two ways to deploy it:

#### Option A: Using Supabase CLI

Deploy the function using the Supabase CLI:

```bash
npx supabase functions deploy utm-tracking
```

#### Option B: Manual Deployment via Supabase Dashboard

If the CLI method fails, you can manually deploy through the Supabase dashboard:

1. Log in to your Supabase dashboard at https://app.supabase.com/
2. Navigate to your project
3. Go to Edge Functions in the left sidebar
4. Click "Create a new function"
5. Name it `utm-tracking`
6. Copy and paste the contents of `supabase/functions/utm-tracking/index.ts` into the editor
7. Click "Deploy function"

### 3. Verify Edge Function Deployment

After deployment, verify that the function is accessible:

1. In the Supabase dashboard, go to Edge Functions
2. Look for the `utm-tracking` function in the list
3. Check that its status is "Active"
4. Note the URL shown in the format `https://<project-id>.supabase.co/functions/v1/utm-tracking`

### 4. Find Your Supabase Project ID

Your Supabase project ID is needed for the tracking component. You can find it in:

1. The Supabase dashboard URL: `https://app.supabase.com/project/<project-id>`
2. The API Settings page in your project
3. The URL of any Edge Function

### 5. Add the Tracking Script to Your Target Website

Navigate to the tracking script page in the admin panel:

```
/utm-content-magic/analytics/tracking-script
```

You'll get the tracking script to add to your target website. There are several options:

#### Option A: Script Tag for Any Website

Add the script tag to the `<head>` section of your website:

```html
<script src="https://YOUR_PROJECT_ID.supabase.co/functions/v1/utm-tracking-script" async></script>
```

#### Option B: NPM Package for Modern JavaScript Apps

If your website uses a modern JavaScript framework:

```bash
npm install utm-content-tracker
```

Then in your app:

```jsx
import { UTMContentTracker } from 'utm-content-tracker';

function App() {
  return (
    <>
      <YourApp />
      <UTMContentTracker
        projectId="YOUR_PROJECT_ID" 
        trackClicks={true}
        trackMouseMovement={true}
      />
    </>
  );
}
```

#### Option C: Webflow Integration

If you're using Webflow, we provide a specialized installation guide with Webflow-specific instructions:

```
/utm-content-magic/analytics/webflow-script
```

This guide includes detailed steps for adding the tracking script to your Webflow site using the Custom Code sections in Webflow's project settings.

### 6. Access the Analytics Dashboard

The analytics dashboard is available at:

```
/utm-content-magic/analytics
```

You'll find the User Journey and Heatmap tabs in the analytics dashboard.

## Troubleshooting

### Edge Function Not Found 

If you see errors like `ERR_NAME_NOT_RESOLVED` or `Failed to fetch` when trying to track journeys:

1. Check that you're using the correct project ID in the tracking script
2. Verify the edge function is deployed correctly in the Supabase dashboard
3. Test the edge function directly from the Supabase dashboard using the "Invoke" button
4. Check the browser console for detailed error messages

### Missing Database Tables

If you see setup notices in the dashboard:

1. Ensure you've run the migration files successfully
2. Check the Supabase Table Editor to confirm the tables exist: `journey_tracking`, `click_tracking`, and `mouse_tracking`
3. Run the migration manually if necessary:
   ```sql
   -- Run this in the SQL Editor in your Supabase dashboard
   -- Check the contents of supabase/migrations/20240325_add_journey_tracking.sql
   ```

## How It Works

### User Journey Tracking

1. When a user visits a page on your target website, the tracking script records:
   - Page URL and title
   - Time of visit
   - Previous page (if any)
   - Time spent on previous page
   - UTM parameters

2. A unique journey ID is assigned to each user session, allowing you to follow their entire path through your site.

3. The Journey Visualizer shows:
   - Complete user paths through your site
   - Entry and exit points
   - Time spent on each page
   - Page transitions

### Heatmap Tracking

1. The tracking script records:
   - Click positions (x, y coordinates)
   - Elements that were clicked
   - Mouse movement patterns (when enabled)

2. The Heatmap Visualizer shows:
   - Click density across pages
   - Most interacted elements
   - Mouse movement patterns
   - User attention areas

## Platform Compatibility

The tracking script works on all major website platforms:

- Custom websites and web applications
- WordPress
- Webflow
- Wix
- Shopify
- Squarespace
- Other CMS platforms with custom code support

For platform-specific installation guides, check the analytics dashboard.

## Data Storage Considerations

For high-traffic sites, consider:

1. Lowering the `sampleRate` for mouse movements (e.g., 0.01-0.05)
2. Creating database retention policies for older data
3. Setting up partitioning for the tracking tables

Example retention policy SQL:

```sql
-- Delete tracking data older than 90 days
CREATE OR REPLACE FUNCTION delete_old_tracking_data()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM journey_tracking WHERE timestamp < NOW() - INTERVAL '90 days';
  DELETE FROM click_tracking WHERE timestamp < NOW() - INTERVAL '90 days';
  DELETE FROM mouse_tracking WHERE timestamp < NOW() - INTERVAL '90 days';
END;
$$;

-- Set up a scheduled job to run daily
SELECT cron.schedule('0 0 * * *', 'SELECT delete_old_tracking_data()');
```

## Remember

The tracking script collects data from your target website, not from the UTM Content Magic admin panel itself. 