import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.5.0";

// CORS configuration
function setCorsHeaders(req: Request): HeadersInit {
  const origin = req.headers.get("origin");
  
  return {
    "Access-Control-Allow-Origin": origin || "https://manks.webflow.io",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
  };
}

serve(async (req) => {
  const corsHeaders = setCorsHeaders(req);
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { 
      headers: corsHeaders 
    });
  }

  try {
    // Create a Supabase client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get the request payload
    let payload;
    if (req.method === "POST") {
      payload = await req.json();
    } else {
      // Get the URL parameters
      const url = new URL(req.url);
      payload = Object.fromEntries(url.searchParams.entries());
    }

    console.log("Tracking Payload:", payload);

    // Check the event type to determine which table to insert into
    const eventType = payload.event_type || "pageview";
    
    // Add common data like IP address
    payload = {
      ...payload,
      ip_address: req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || null,
      user_agent: req.headers.get("user-agent") || null,
      timestamp: new Date().toISOString(),
    };
    
    // Handle different event types
    let data, error;
    
    switch (eventType) {
      case "click":
        // Handle click tracking
        const clickData = {
          client_id: payload.client_id,
          session_id: payload.session_id,
          journey_id: payload.journey_id,
          page_url: payload.page_url,
          x: payload.x,
          y: payload.y,
          element_selector: payload.element_selector,
          element_text: payload.element_text,
          timestamp: payload.timestamp
        };
        
        ({ data, error } = await supabaseAdmin
          .from("click_tracking")
          .insert([clickData]));
        break;
        
      case "mousemove":
        // Handle mouse movement tracking
        const mouseData = {
          client_id: payload.client_id,
          session_id: payload.session_id,
          journey_id: payload.journey_id,
          page_url: payload.page_url,
          coordinates: payload.coordinates,
          viewport_width: payload.screen_width,
          viewport_height: payload.screen_height,
          timestamp: payload.timestamp
        };
        
        ({ data, error } = await supabaseAdmin
          .from("mouse_tracking")
          .insert([mouseData]));
        break;
        
      case "pageview":
      default:
        // Check if the client_id exists in the database already to determine if it's a new or returning visitor
        let isNewVisitor = true;
        if (payload.client_id) {
          const { data: existingVisitor, error: lookupError } = await supabaseAdmin
            .from("utm_tracking")
            .select("client_id")
            .eq("client_id", payload.client_id)
            .limit(1);
          
          if (lookupError) {
            console.error("Error looking up client:", lookupError);
          } else {
            isNewVisitor = !existingVisitor || existingVisitor.length === 0;
          }
        }
        
        // Create the classic UTM tracking record
        const utmParams = {
          utm_source: payload.utm_source || null,
          utm_medium: payload.utm_medium || null,
          utm_campaign: payload.utm_campaign || null,
          utm_term: payload.utm_term || null,
          utm_content: payload.utm_content || null,
          page_url: payload.page_url || null,
          page_title: payload.page_title || null,
          referrer: payload.referrer || null,
          ip_address: payload.ip_address,
          user_agent: payload.user_agent,
          client_id: payload.client_id || null,
          first_visit: isNewVisitor,
          is_direct: !payload.utm_source && !payload.referrer,
          session_id: payload.session_id || null,
          visit_count: payload.visit_count || 1,
          timestamp: payload.timestamp,
          event_type: eventType
        };
  
        console.log("UTM Parameters for tracking:", utmParams);
  
        // Insert UTM tracking data
        ({ data, error } = await supabaseAdmin
          .from("utm_tracking")
          .insert([utmParams]));
          
        // If journey tracking is enabled, also insert journey data
        if (payload.journey_id) {
          const journeyData = {
            client_id: payload.client_id,
            session_id: payload.session_id,
            journey_id: payload.journey_id,
            previous_page_url: payload.previous_page_url,
            page_url: payload.page_url,
            page_title: payload.page_title,
            page_sequence: payload.page_sequence || 1,
            time_on_previous_page: payload.time_on_previous_page,
            timestamp: payload.timestamp,
            first_visit: isNewVisitor,
            utm_source: payload.utm_source || null,
            utm_medium: payload.utm_medium || null,
            utm_campaign: payload.utm_campaign || null,
            utm_term: payload.utm_term || null,
            utm_content: payload.utm_content || null
          };
          
          const { error: journeyError } = await supabaseAdmin
            .from("journey_tracking")
            .insert([journeyData]);
            
          if (journeyError) {
            console.error("Error inserting journey data:", journeyError);
          }
        }
        
        break;
    }

    if (error) {
      console.error("Database insert error:", error);
      
      // Try to determine if it's a schema issue
      if (error.message && error.message.includes("column") && error.message.includes("does not exist")) {
        // Attempt to determine which column is causing the issue
        const missingColumns = [];
        if (error.message.includes("first_visit")) missingColumns.push("first_visit");
        if (error.message.includes("is_direct")) missingColumns.push("is_direct");
        if (error.message.includes("session_id")) missingColumns.push("session_id");
        if (error.message.includes("visit_count")) missingColumns.push("visit_count");
        if (error.message.includes("event_type")) missingColumns.push("event_type");
        
        throw new Error(`Schema error: Missing columns: ${missingColumns.join(", ")}. Please update your database schema.`);
      } else {
        throw error;
      }
    }

    // Return success
    return new Response(
      JSON.stringify({ 
        success: true,
        event_type: eventType,
        timestamp: payload.timestamp
      }),
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
      JSON.stringify({ 
        error: error.message, 
        success: false,
        timestamp: new Date().toISOString()
      }),
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