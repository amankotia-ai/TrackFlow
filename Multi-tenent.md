# Adding Multi-Tenancy to the UTM Content Magic Project

To add multi-tenancy support to this project, we need to modify how the script URL works so it can identify different tenants and serve tenant-specific content rules. Here's a comprehensive plan to implement this:

## 1. Database Schema Changes

First, we need to update the database schema to support multiple tenants:

```sql
-- New tenants table
CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add tenant_id to content_rules table
ALTER TABLE public.content_rules ADD COLUMN tenant_id UUID REFERENCES public.tenants(id);
```

## 2. Update the Edge Function

Modify the UTM content edge function to handle tenant-specific rules:

```typescript:supabase/functions/utm-content/index.ts
// ... existing code ...

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create a Supabase client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get the URL parameters
    const url = new URL(req.url);
    const params = Object.fromEntries(url.searchParams.entries());
    console.log("URL Parameters:", params);
    
    // Get tenant ID from the path or params
    const tenantSlug = params.tenant;
    if (!tenantSlug) {
      return new Response(
        JSON.stringify({ error: "Tenant identifier is required" }),
        { 
          status: 400,
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders 
          } 
        }
      );
    }
    
    // Lookup tenant by slug
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from("tenants")
      .select("id")
      .eq("slug", tenantSlug)
      .single();
      
    if (tenantError || !tenant) {
      return new Response(
        JSON.stringify({ error: "Invalid tenant" }),
        { 
          status: 404,
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders 
          } 
        }
      );
    }

    // Extract UTM parameters
    const utmParams = {
      utm_source: params.utm_source,
      utm_medium: params.utm_medium,
      utm_campaign: params.utm_campaign,
      utm_term: params.utm_term,
      utm_content: params.utm_content,
    };

    console.log("UTM Parameters:", utmParams);

    // Only get active rules for this tenant
    let query = supabaseAdmin
      .from("content_rules")
      .select("*")
      .eq("active", true)
      .eq("tenant_id", tenant.id);
    
    // ... existing code (filtering rules) ...
    
    // Return the matching rules
    return new Response(
      JSON.stringify({ rules: matchingRules }),
      { 
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders 
        } 
      }
    );
  } catch (error) {
    // ... existing error handling ...
  }
});
```

## 3. Update the Script Generation

Update the `ScriptIntegration.tsx` component to include tenant identification in the generated script:

```typescript:src/components/ScriptIntegration.tsx
// ... existing code ...

const generateScriptContent = () => {
  // Get the Supabase URL and project ID safely
  const supabaseUrl = "https://zekigsebsmsukrummrzq.supabase.co";
  const projectId = "zekigsebsmsukrummrzq";
  
  return `
// UTM Content Magic Script (v1.0.2)
(function() {
  const PROJECT_ID = "${projectId}";
  
  // Get the current script tag to extract tenant information
  const getCurrentScript = () => {
    if (document.currentScript) {
      return document.currentScript;
    }
    // Fallback for older browsers
    const scripts = document.getElementsByTagName('script');
    return scripts[scripts.length - 1];
  };
  
  // Extract tenant from script src
  const script = getCurrentScript();
  const scriptSrc = script.src;
  const tenantMatch = scriptSrc.match(/tenant=([^&]+)/);
  const tenant = tenantMatch ? tenantMatch[1] : null;
  
  if (!tenant) {
    console.error('UTM Content Magic: No tenant parameter in script URL');
    return;
  }
  
  // Function to get URL parameters
  const getUrlParams = () => {
    const params = {};
    window.location.search.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(_, key, value) {
      params[key] = decodeURIComponent(value);
    });
    return params;
  };
  
  // ... existing condition matching functions ...
  
  // Main init function
  const init = async () => {
    try {
      const params = getUrlParams();
      console.log('UTM Content Magic: URL parameters:', params);
      
      const hasUtmParams = Object.keys(params).some(key => key.startsWith('utm_'));
      
      if (!hasUtmParams) {
        console.log('UTM Content Magic: No UTM parameters found');
        return;
      }
      
      console.log('UTM Content Magic: UTM parameters detected', params);
      
      // Include tenant in the API URL
      const apiUrl = \`https://\${PROJECT_ID}.supabase.co/functions/v1/utm-content\`;
      const utmParams = new URLSearchParams(params);
      utmParams.append('tenant', tenant);
      const queryString = utmParams.toString();
      
      console.log(\`UTM Content Magic: Fetching rules from \${apiUrl}?\${queryString}\`);
      
      const response = await fetch(\`\${apiUrl}?\${queryString}\`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      // ... existing response handling ...
    } catch (error) {
      console.error('UTM Content Magic: Error initializing:', error);
    }
  };
  
  // ... existing initialization code ...
})();
  `;
};
```

## 4. UI Updates for Tenant Management

Create UI components for managing tenants:

1. Add a tenant management page where users can create/edit tenants
2. Update the admin dashboard to filter content rules by tenant
3. Add tenant selection to the script integration component 

## 5. Script Usage Instructions

Update the documentation and UI to show how to include the tenant parameter in the script URL:

```html
<!-- Example script tag with tenant parameter -->
<script src="https://zekigsebsmsukrummrzq.supabase.co/storage/v1/object/public/scripts/utm-magic.js?tenant=acme-corp"></script>
```

## Implementation Strategy

1. First, create the database schema changes
2. Update the edge function to handle tenants but maintain backward compatibility
3. Modify the script generator to include tenant support
4. Create the tenant management UI
5. Test with multiple tenants

This approach keeps the core UTM content replacement functionality intact while adding the multi-tenant layer on top. The tenant identification is built into the script URL, making it easy to serve different content rules to different customers without creating multiple copies of the script.
