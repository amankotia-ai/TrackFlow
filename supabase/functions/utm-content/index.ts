
import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    // Build the query
    let query = supabaseAdmin
      .from("content_rules")
      .select("*")
      .eq("active", true);

    // Filter based on UTM parameters
    const utmParams = {
      utm_source: params.utm_source,
      utm_medium: params.utm_medium,
      utm_campaign: params.utm_campaign,
      utm_term: params.utm_term,
      utm_content: params.utm_content,
    };

    console.log("UTM Parameters:", utmParams);

    // Create a logical OR for each UTM parameter that matches the condition type and value
    const filters = [];
    
    for (const [key, value] of Object.entries(utmParams)) {
      if (value) {
        filters.push(`and(condition_type.eq.${key},condition_value.eq.${value})`);
      }
    }

    if (filters.length > 0) {
      query = query.or(filters.join(","));
    }

    // Execute the query
    const { data, error } = await query;

    if (error) throw error;

    console.log("Matching rules:", data);

    // Return the matching rules
    return new Response(
      JSON.stringify({ rules: data }),
      { 
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders 
        } 
      }
    );
  } catch (error) {
    console.error("Error:", error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders 
        } 
      }
    );
  }
});
