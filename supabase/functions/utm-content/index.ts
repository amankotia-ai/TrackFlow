
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.7";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Parse URL params from the request
    const url = new URL(req.url);
    const params = Object.fromEntries(url.searchParams.entries());
    
    console.log('Received parameters:', params);
    
    // Get active content rules that match any of the UTM parameters
    const { data: rules, error } = await supabase
      .from('content_rules')
      .select('*')
      .eq('active', true);

    if (error) {
      console.error('Error fetching rules:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch content rules' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Retrieved rules:', rules);
    
    // Filter rules that match the current UTM parameters
    const matchingRules = rules.filter(rule => {
      const conditionType = rule.condition_type;
      const conditionValue = rule.condition_value;
      
      if (conditionType.startsWith('utm_')) {
        // Check if the UTM parameter exists and matches the condition value
        return params[conditionType] === conditionValue;
      } else if (conditionType === 'referrer' && req.headers.get('referer')) {
        // Check if the referrer contains the condition value
        return req.headers.get('referer')?.includes(conditionValue);
      }
      
      return false;
    });

    console.log('Matching rules:', matchingRules);
    
    // Return the matching rules as JSON
    return new Response(
      JSON.stringify({ 
        rules: matchingRules,
        params: params,
        referrer: req.headers.get('referer') || null
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in utm-content function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
