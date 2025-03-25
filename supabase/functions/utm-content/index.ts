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

    // Extract UTM parameters
    const utmParams = {
      utm_source: params.utm_source,
      utm_medium: params.utm_medium,
      utm_campaign: params.utm_campaign,
      utm_term: params.utm_term,
      utm_content: params.utm_content,
    };

    console.log("UTM Parameters:", utmParams);

    // Only get active rules
    let query = supabaseAdmin
      .from("content_rules")
      .select("*")
      .eq("active", true);
    
    // Create an array to track queries for each UTM parameter
    const presentUtmParams = Object.entries(utmParams).filter(([_, value]) => value);
    
    // If no UTM parameters are provided, return no rules
    if (presentUtmParams.length === 0) {
      return new Response(
        JSON.stringify({ rules: [] }),
        { 
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders 
          } 
        }
      );
    }
    
    // Get all active rules first
    const { data: allRules, error: rulesError } = await query;
    
    if (rulesError) throw rulesError;
    
    // Now filter the rules to only include those that match ANY of the provided UTM parameters
    // with exact value matching
    const matchingRules = allRules.filter(rule => {
      // Each rule has a specific UTM parameter type and value it's checking for
      // If that exact UTM parameter is in the URL with the exact value, include the rule
      const paramValue = utmParams[rule.condition_type];
      
      // Only match if the parameter exists and has the exact same value as the rule requires
      return paramValue !== undefined && paramValue === rule.condition_value;
    });
    
    console.log("Matching rules:", matchingRules);
    
    // Track rule usage for analytics
    try {
      // For each matching rule, record usage
      for (const rule of matchingRules) {
        // Create usage record
        const usageData = {
          rule_id: rule.id,
          page_url: params.page_url || null,
          client_id: params.client_id || `anonymous_${Math.random().toString(36).substring(2, 10)}`,
          utm_source: params.utm_source || null,
          utm_medium: params.utm_medium || null,
          utm_campaign: params.utm_campaign || null,
          utm_term: params.utm_term || null,
          utm_content: params.utm_content || null,
          timestamp: new Date().toISOString()
        };
        
        // Insert usage record
        await supabaseAdmin
          .from("content_rule_usage")
          .insert([usageData])
          .then(({ error }) => {
            if (error) {
              console.error("Failed to track rule usage:", error);
            }
          });
      }
    } catch (trackingError) {
      // Don't fail the request if tracking fails
      console.error("Error tracking rule usage:", trackingError);
    }
    
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
