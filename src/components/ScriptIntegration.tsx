import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Copy, ExternalLink, Upload, Check, Info, Link2, Loader2, Code, Settings, Globe, BarChart3, MapPin, ClipboardIcon, CheckCircle2 } from "lucide-react";
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { fadeIn } from "@/lib/animations";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const ScriptIntegration: React.FC = () => {
  const { toast } = useToast();
  const [scriptUrl, setScriptUrl] = useState<string>("");
  const [isUploadingScript, setIsUploadingScript] = useState(false);
  const [copied, setCopied] = useState(false);
  const [domain, setDomain] = useState("");
  const [bucketError, setBucketError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [activeTab, setActiveTab] = useState("installation");
  const [scriptModalOpen, setScriptModalOpen] = useState(false);
  const [scriptModalTab, setScriptModalTab] = useState<'head' | 'body'>('head');
  const [verificationResult, setVerificationResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Script for Webflow head section
  const webflowHeadScript = `
<!-- UTM Content Magic Tracking Script - HEAD -->
<script>
  window.utmCmConfig = {
    projectId: "zekigsebsmsukrummrzq",
    trackClicks: true,
    trackScrolls: true,
    trackForms: true
  };
</script>
`.trim();

  // Script for Webflow body section (simplified for demo)
  const webflowBodyScript = `
<!-- UTM Content Magic Tracking Script - BODY -->
<script>
(function() {
  // Get config from head
  var config = window.utmCmConfig || {};
  var projectId = config.projectId || "zekigsebsmsukrummrzq";
  var trackClicks = config.trackClicks !== false;
  var trackScrolls = config.trackScrolls !== false;
  var trackForms = config.trackForms !== false;

  // Generate a client ID for tracking if not exists
  function generateClientId() {
    var clientId = localStorage.getItem('utm_magic_client_id');
    if (!clientId) {
      clientId = 'utm_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('utm_magic_client_id', clientId);
    }
    return clientId;
  }

  // Function to get URL parameters
  function getUrlParams() {
    var params = {};
    window.location.search.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(_, key, value) {
      params[key] = decodeURIComponent(value);
    });
    return params;
  }

  // Store UTM parameters in cookies and localStorage for cross-page tracking
  function storeUtmParams(params) {
    var utmParams = {};
    var hasUtmParams = false;
    
    // Extract only UTM parameters
    for (var key in params) {
      if (key.startsWith('utm_')) {
        utmParams[key] = params[key];
        hasUtmParams = true;
        
        // Set cookies for each UTM parameter (90 day expiry)
        setCookie(key, params[key], 90);
        
        // Also store in localStorage as backup
        try {
          localStorage.setItem(key, params[key]);
        } catch (e) {
          console.warn('UTM Content Magic: localStorage not available', e);
        }
      }
    }
    
    if (hasUtmParams) {
      // Store timestamp when these UTM params were first seen
      if (!localStorage.getItem('utm_timestamp')) {
        localStorage.setItem('utm_timestamp', Date.now().toString());
      }
      
      return utmParams;
    }
    
    return null;
  }

  // Helper to set cookies with expiry
  function setCookie(name, value, days) {
    var expires = '';
    if (days) {
      var date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      expires = '; expires=' + date.toUTCString();
    }
    document.cookie = name + '=' + (value || '') + expires + '; path=/; SameSite=Lax';
  }

  // Helper to get cookie value
  function getCookie(name) {
    var nameEQ = name + '=';
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
      var c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  }

  // Function to track UTM parameters
  function trackUtmParameters(params) {
    try {
      // Store UTM parameters for cross-page tracking
      var utmParams = storeUtmParams(params);
      
      // Only track if there are UTM parameters
      if (!utmParams) {
        // Check if we have stored UTM params from previous pages
        utmParams = getStoredUtmParams();
        
        if (!utmParams) {
          console.log('UTM Content Magic: No UTM parameters found, skipping tracking');
          return;
        }
      }
      
      var trackingUrl = 'https://' + projectId + '.supabase.co/functions/v1/utm-tracking';
      
      // Prepare tracking data
      var trackingData = {
        ...utmParams,
        page_url: window.location.href,
        page_title: document.title,
        referrer: document.referrer,
        client_id: generateClientId(),
        session_id: getSessionId(),
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent,
        screen_resolution: window.screen.width + 'x' + window.screen.height
      };
      
      console.log('UTM Content Magic: Sending tracking data', trackingData);
      
      // Use Beacon API if available for reliable tracking, even on page exit
      if (navigator.sendBeacon) {
        var blob = new Blob([JSON.stringify(trackingData)], { type: 'application/json' });
        var sent = navigator.sendBeacon(trackingUrl, blob);
        console.log('UTM Content Magic: Tracking data sent via Beacon API, success:', sent);
      } else {
        // Fallback to fetch API
        fetch(trackingUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(trackingData),
          keepalive: true,
          credentials: 'omit'
        })
        .then(function(response) {
          if (response.ok) {
            console.log('UTM Content Magic: Tracking data sent successfully via Fetch API');
          } else {
            console.error('UTM Content Magic: Error sending tracking data:', response.statusText);
          }
        })
        .catch(function(error) {
          console.error('UTM Content Magic: Error sending tracking data:', error);
        });
      }
    } catch (error) {
      console.error('UTM Content Magic: Error sending tracking data:', error);
    }
  }

  // Get stored UTM parameters from cookies/localStorage
  function getStoredUtmParams() {
    var params = {};
    var hasParams = false;
    
    // Common UTM parameters to check
    var utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
    
    utmKeys.forEach(function(key) {
      // Try to get from cookie first
      var value = getCookie(key);
      
      // If not in cookie, try localStorage
      if (!value) {
        try {
          value = localStorage.getItem(key);
        } catch (e) {
          // Ignore localStorage errors
        }
      }
      
      if (value) {
        params[key] = value;
        hasParams = true;
      }
    });
    
    return hasParams ? params : null;
  }

  // Session management
  function getSessionId() {
    var sessionId = sessionStorage.getItem('utm_magic_session_id');
    if (!sessionId) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
      sessionStorage.setItem('utm_magic_session_id', sessionId);
    }
    return sessionId;
  }

  // Track clicks if enabled
  function setupClickTracking() {
    if (!trackClicks) return;
    
    document.addEventListener('click', function(e) {
      var target = e.target;
      
      // Traverse up to find closest link or button
      while (target && target !== document && (target.tagName !== 'A' && target.tagName !== 'BUTTON')) {
        target = target.parentNode;
      }
      
      if (!target || target === document) return;
      
      var trackingData = {
        event_type: 'click',
        element_tag: target.tagName,
        element_id: target.id || null,
        element_class: target.className || null,
        element_text: target.innerText || target.textContent || null,
        client_id: generateClientId(),
        session_id: getSessionId(),
        page_url: window.location.href,
        utmData: getStoredUtmParams() || {},
        timestamp: new Date().toISOString()
      };
      
      // If it's a link, track href and if it's external
      if (target.tagName === 'A') {
        trackingData.href = target.href || null;
        trackingData.is_external = target.hostname !== window.location.hostname;
      }
      
      // Send data to tracking endpoint
      sendEventData(trackingData);
    });
  }

  // Track form submissions if enabled
  function setupFormTracking() {
    if (!trackForms) return;
    
    document.addEventListener('submit', function(e) {
      var form = e.target;
      
      if (form.tagName !== 'FORM') return;
      
      var formFields = [];
      var formData = new FormData(form);
      
      // Gather non-sensitive form fields (exclude password, credit card, etc.)
      formData.forEach(function(value, key) {
        if (!key.toLowerCase().includes('password') && !key.toLowerCase().includes('card') && 
            !key.toLowerCase().includes('cvv') && !key.toLowerCase().includes('secret')) {
          formFields.push(key);
        }
      });
      
      var trackingData = {
        event_type: 'form_submit',
        form_id: form.id || null,
        form_class: form.className || null,
        form_action: form.action || null,
        form_method: form.method || null,
        form_fields: formFields, // Only names of fields, not values
        client_id: generateClientId(),
        session_id: getSessionId(),
        page_url: window.location.href,
        utmData: getStoredUtmParams() || {},
        timestamp: new Date().toISOString()
      };
      
      // Send data to tracking endpoint
      sendEventData(trackingData);
    });
  }

  // Track scroll depth if enabled
  function setupScrollTracking() {
    if (!trackScrolls) return;
    
    var scrollDepths = [25, 50, 75, 100];
    var trackedDepths = {};
    
    // Function to calculate scroll depth
    function getScrollDepth() {
      var scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
      var scrollHeight = Math.max(
        document.body.scrollHeight, 
        document.documentElement.scrollHeight,
        document.body.offsetHeight, 
        document.documentElement.offsetHeight
      ) - window.innerHeight;
      
      return scrollHeight > 0 ? Math.round((scrollTop / scrollHeight) * 100) : 100;
    }
    
    // Track scroll depth
    window.addEventListener('scroll', debounce(function() {
      var depth = getScrollDepth();
      
      // Check which thresholds have been crossed
      scrollDepths.forEach(function(threshold) {
        if (depth >= threshold && !trackedDepths[threshold]) {
          trackedDepths[threshold] = true;
          
          var trackingData = {
            event_type: 'scroll_depth',
            depth_percentage: threshold,
            client_id: generateClientId(),
            session_id: getSessionId(),
            page_url: window.location.href,
            utmData: getStoredUtmParams() || {},
            timestamp: new Date().toISOString()
          };
          
          sendEventData(trackingData);
        }
      });
    }, 500));
  }

  // Utility: Debounce function to limit event firing
  function debounce(func, wait) {
    var timeout;
    return function() {
      var context = this, args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(function() {
        func.apply(context, args);
      }, wait);
    };
  }

  // Send tracking event data to endpoint
  function sendEventData(eventData) {
    var eventUrl = 'https://' + projectId + '.supabase.co/functions/v1/track-event';
    
    try {
      if (navigator.sendBeacon) {
        var blob = new Blob([JSON.stringify(eventData)], { type: 'application/json' });
        navigator.sendBeacon(eventUrl, blob);
      } else {
        fetch(eventUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(eventData),
          keepalive: true,
          credentials: 'omit'
        });
      }
    } catch (error) {
      console.error('UTM Content Magic: Error sending event data:', error);
    }
  }
  
  // Initialize tracking functionality
  function initTracking() {
    console.log('UTM Content Magic: Tracking initialized with config:', config);
    
    // First, track UTM parameters if present
    var params = getUrlParams();
    trackUtmParameters(params);
    
    // Set up event tracking based on configuration
    setupClickTracking();
    setupFormTracking();
    setupScrollTracking();
    
    // Track page view
    var pageViewData = {
      event_type: 'page_view',
      page_url: window.location.href,
      page_title: document.title,
      referrer: document.referrer,
      client_id: generateClientId(),
      session_id: getSessionId(),
      utmData: getStoredUtmParams() || {},
      timestamp: new Date().toISOString()
    };
    
    sendEventData(pageViewData);
  }

  // Start the tracking when the DOM is fully loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTracking);
  } else {
    initTracking();
  }
})();
</script>
`.trim();

  useEffect(() => {
    // Log authentication state to help with debugging
    const logAuthState = async () => {
      try {
        const { data: session } = await supabase.auth.getSession();
        console.log("Current auth session:", session);
        
        if (!session?.session) {
          console.warn("No active session found. User might not be properly authenticated.");
        } else {
          console.log("User is authenticated with ID:", session.session.user.id);
        }
      } catch (error) {
        console.error("Error checking authentication state:", error);
      }
    };
    
    logAuthState();
    checkScriptExists();
  }, []);

  useEffect(() => {
    if (copied) {
      const timeout = setTimeout(() => {
        setCopied(false);
      }, 2000);
      
      return () => clearTimeout(timeout);
    }
  }, [copied]);

  const checkScriptExists = async () => {
    try {
      // We're assuming the bucket already exists (it should be created via migrations or Supabase dashboard)
      // Just try to list the files in the scripts bucket
      const { data, error } = await supabase
        .storage
        .from('scripts')
        .list();
      
      if (error) {
        console.error('Error accessing scripts bucket:', error);
        
        // Specific error handling for common cases
        if (error.message.includes('does not exist')) {
          setBucketError("The 'scripts' bucket doesn't exist in your Supabase project. Please create it from the Supabase dashboard.");
        } else if (error.message.includes('permission denied') || error.message.includes('unauthorized')) {
          setBucketError("Permission denied. Make sure you're authenticated and have access to the 'scripts' bucket.");
        } else {
          setBucketError(`Error accessing storage: ${error.message}`);
        }
        return;
      }
      
      const scriptFile = data.find(file => file.name === 'utm-magic.js');
      if (scriptFile) {
        const { data: urlData } = await supabase
          .storage
          .from('scripts')
          .getPublicUrl('utm-magic.js');
        
        setScriptUrl(urlData.publicUrl);
      }
    } catch (error: any) {
      console.error('Error checking script:', error);
      setBucketError(`Storage error: ${error.message || "Unknown error"}`);
    }
  };

  const uploadScript = async () => {
    try {
      setIsUploadingScript(true);
      setBucketError(null);
      
      // Try to upload directly without checking bucket existence
      const scriptContent = generateScriptContent();
      
      console.log("Uploading script to storage bucket...");
      
      const { error } = await supabase
        .storage
        .from('scripts')
        .upload('utm-magic.js', new Blob([scriptContent], { type: 'application/javascript' }), {
          cacheControl: '3600',
          upsert: true
        });
      
      if (error) {
        console.error("Storage upload error:", error);
        // Specific error handling for bucket not existing
        if (error.message.includes('does not exist')) {
          setBucketError("The 'scripts' bucket doesn't exist. Please create it from the Supabase dashboard.");
        } else if (error.message.includes('permission denied') || error.message.includes('unauthorized')) {
          setBucketError("Permission denied. Make sure you're authenticated and have the right permissions.");
        } else {
          setBucketError(`Upload error: ${error.message}`);
        }
        return;
      }
      
      const { data: urlData } = await supabase
        .storage
        .from('scripts')
        .getPublicUrl('utm-magic.js');
      
      setScriptUrl(urlData.publicUrl);
      
      toast({
        title: "Success",
        description: "Script uploaded successfully",
      });
    } catch (error: any) {
      console.error('Error uploading script:', error);
      const errorMessage = error.message || "Failed to upload script";
      const errorDetails = error.details || error.statusText || "";
      toast({
        title: "Error",
        description: `${errorMessage} ${errorDetails ? `(${errorDetails})` : ""}`,
        variant: "destructive"
      });
    } finally {
      setIsUploadingScript(false);
    }
  };

  const handleCopy = () => {
    setCopied(true);
    toast({
      title: "Copied!",
      description: "Script code copied to clipboard",
    });
  };

  const generateScriptTag = () => {
    // Get the Supabase URL and project ID safely
    const supabaseUrl = "https://zekigsebsmsukrummrzq.supabase.co";
    const projectId = "zekigsebsmsukrummrzq";
    
    return `<script src="https://${projectId}.supabase.co/storage/v1/object/public/scripts/utm-magic.js"></script>`;
  };

  const handleDomainSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (domain) {
      toast({
        title: "Domain Saved",
        description: `Your script will now work on ${domain}`,
      });
      
      // Verify script installation after saving domain
      verifyScriptInstallation();
    }
  };

  const generateScriptContent = () => {
    // Get the Supabase URL and project ID safely
    const supabaseUrl = "https://zekigsebsmsukrummrzq.supabase.co";
    const projectId = "zekigsebsmsukrummrzq";
    
    // We don't need the anon key in the client script as we'll use public functions
    
    return `
// UTM Content Magic Script (v1.2.0)
(function() {
  const PROJECT_ID = "${projectId}";
  
  // Generate a client ID for tracking if not exists
  const generateClientId = () => {
    let clientId = localStorage.getItem('utm_magic_client_id');
    if (!clientId) {
      clientId = 'utm_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('utm_magic_client_id', clientId);
    }
    return clientId;
  };
  
  // Function to get URL parameters
  const getUrlParams = () => {
    const params = {};
    window.location.search.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(_, key, value) {
      params[key] = decodeURIComponent(value);
    });
    return params;
  };
  
  // Function to track UTM parameters
  const trackUtmParameters = async (params) => {
    try {
      // Only track if there are UTM parameters
      const hasUtmParams = Object.keys(params).some(key => key.startsWith('utm_'));
      if (!hasUtmParams) {
        console.log('UTM Content Magic: No UTM parameters found, skipping tracking');
        return;
      }
      
      const trackingUrl = \`https://\${PROJECT_ID}.supabase.co/functions/v1/utm-tracking\`;
      
      // Prepare tracking data
      const trackingData = {
        ...params,
        page_url: window.location.href,
        referrer: document.referrer,
        client_id: generateClientId(),
      };
      
      console.log('UTM Content Magic: Sending tracking data', trackingData);
      
      // Use Beacon API if available for reliable tracking, even on page exit
      if (navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify(trackingData)], { type: 'application/json' });
        const sent = navigator.sendBeacon(trackingUrl, blob);
        console.log('UTM Content Magic: Tracking data sent via Beacon API, success:', sent);
      } else {
        // Fallback to fetch API
        const response = await fetch(trackingUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(trackingData),
          keepalive: true,
          credentials: 'omit'
        });
        
        if (response.ok) {
          console.log('UTM Content Magic: Tracking data sent successfully via Fetch API');
        } else {
          console.error('UTM Content Magic: Error sending tracking data:', await response.text());
        }
      }
    } catch (error) {
      console.error('UTM Content Magic: Error sending tracking data:', error);
    }
  };
  
  // Function to check if a rule's conditions match the UTM parameters
  const matchesCondition = (rule, params) => {
    if (!rule || !rule.condition_type || !rule.condition_value) return false;
    const utmValue = params[rule.condition_type];
    
    // Add more detailed logging for debugging matching issues
    console.log(\`UTM Content Magic: Checking condition match - Rule requires \${rule.condition_type}="\${rule.condition_value}", URL has \${rule.condition_type}="\${utmValue}"\`);
    
    // Ensure we're doing a strict string comparison (case-sensitive)
    return typeof utmValue === 'string' && 
           typeof rule.condition_value === 'string' && 
           utmValue === rule.condition_value;
  };
  
  // Function to apply content rules
  const applyContentRules = (rules, params) => {
    if (!rules || !rules.length) return;
    
    console.log('UTM Content Magic: Found potential rules:', rules);
    let appliedRules = 0;
    
    // Track which elements have been modified and by which rule type
    const modifiedElements = new Map();
    
    // Track all elements that could be affected by rules
    const elementsMap = new Map();
    
    // First pass: collect all elements that could be affected by any rule
    rules.forEach(rule => {
      const elements = document.querySelectorAll(rule.selector);
      if (elements.length === 0) {
        console.log(\`UTM Content Magic: No elements found for selector "\${rule.selector}"\`);
      }
      elements.forEach(element => {
        const elementId = element.id || element.className || element.tagName + Math.random().toString(36).substr(2, 9);
        if (!elementsMap.has(elementId)) {
          elementsMap.set(elementId, {
            element,
            rules: []
          });
        }
        elementsMap.get(elementId).rules.push(rule);
      });
    });
    
    // Second pass: filter for matching rules and apply them
    for (const [elementId, { element, rules }] of elementsMap.entries()) {
      // Find matching rules for this element
      const matchingRules = rules.filter(rule => matchesCondition(rule, params));
      
      if (matchingRules.length > 0) {
        // Sort by priority (if available in the future)
        const ruleToApply = matchingRules[0]; // Currently just take the first one
        
        // Apply the rule
        try {
          console.log(\`UTM Content Magic: Applying rule "\${ruleToApply.name || 'Unnamed rule'}" to element\`, element);
          element.innerHTML = ruleToApply.replacement_content;
          modifiedElements.set(elementId, ruleToApply.condition_type);
          appliedRules++;
        } catch (error) {
          console.error(\`UTM Content Magic: Error applying rule to element:\`, error, element);
        }
      }
    }
    
    console.log(\`UTM Content Magic: Applied \${appliedRules} rules out of \${rules.length} potential rules\`);
  };
  
  // Initialize the UTM content magic
  const init = async () => {
    try {
      console.log('UTM Content Magic: Initializing...');
      const params = getUrlParams();
      console.log('UTM Content Magic: URL parameters:', params);
      
      // First, track UTM parameters if present
      await trackUtmParameters(params);
      
      // Check for any UTM parameters
      const hasUtmParams = Object.keys(params).some(key => key.startsWith('utm_'));
      if (!hasUtmParams) {
        console.log('UTM Content Magic: No UTM parameters found, skipping content rules');
        return;
      }
      
      // Fetch content rules based on UTM parameters
      const contentRulesUrl = \`https://\${PROJECT_ID}.supabase.co/functions/v1/utm-content\`;
      
      // Add all URL parameters to the request
      const queryString = Object.entries(params)
        .map(([key, value]) => \`\${encodeURIComponent(key)}=\${encodeURIComponent(value)}\`)
        .join('&');
      
      const rulesResponse = await fetch(\`\${contentRulesUrl}?\${queryString}\`, {
        credentials: 'omit'
      });
      
      if (!rulesResponse.ok) {
        console.error('UTM Content Magic: Error fetching content rules:', await rulesResponse.text());
        return;
      }
      
      const rulesData = await rulesResponse.json();
      console.log('UTM Content Magic: Fetched content rules:', rulesData);
      
      if (rulesData.rules && rulesData.rules.length > 0) {
        // Apply rules immediately
        applyContentRules(rulesData.rules, params);
        
        // Set up observation for dynamic content
        // observeDOMChanges(rulesData.rules, params);
      } else {
        console.log('UTM Content Magic: No matching content rules found for these UTM parameters');
      }
    } catch (error) {
      console.error('UTM Content Magic: Initialization error:', error);
    }
  };
  
  // Start the content magic when the DOM is fully loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
`;
  };

  // Add this function to verify script installation
  const verifyScriptInstallation = async () => {
    try {
      setIsVerifying(true);
      // Check if a URL to verify was provided
      if (!domain) {
        setVerificationResult({
          success: false,
          message: "Please enter your website URL first."
        });
        return;
      }

      // Get the project ID for script detection
      const projectId = "zekigsebsmsukrummrzq";

      // Normalize the domain input
      const normalizedDomain = domain.startsWith('http') ? domain : `https://${domain}`;
      
      toast({
        title: "Verification Started",
        description: `Checking if tracking script is properly installed...`,
      });

      // We'll use a CORS proxy to fetch the page
      const corsProxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(normalizedDomain)}`;
      
      try {
        const response = await fetch(corsProxyUrl);
        
        if (!response.ok) {
          throw new Error(`Error fetching website: ${response.statusText}`);
        }
        
        const data = await response.json();
        const html = data.contents;
        
        // Check if the script tag is in the HTML
        const scriptPattern = new RegExp(`<script[^>]*src=["'][^"']*${projectId}[^"']*utm-magic\\.js["'][^>]*>`, 'i');
        
        if (scriptPattern.test(html)) {
          setVerificationResult({
            success: true,
            message: "The UTM tracking script is properly installed on your website!"
          });
        } else {
          setVerificationResult({
            success: false,
            message: "The UTM tracking script was not found on your website. Make sure to add the script tag to your HTML."
          });
        }
      } catch (error) {
        console.error("Error fetching website:", error);
        setVerificationResult({
          success: false, 
          message: `Could not verify script on website. Error: ${error.message}`
        });
      }
      
      // Check if there's any tracking data in the database
      try {
        // Simplified approach: just check if installed on site
        if (verificationResult?.success) {
          toast({
            title: "Script Verified",
            description: "Now upload the script to start tracking UTM parameters."
          });
        }
      } catch (dbError) {
        console.error("Error checking tracking data:", dbError);
        // Don't override the script check result if we failed to check the database
      }
    } catch (error) {
      console.error("Verification error:", error);
      setVerificationResult({
        success: false,
        message: `Error verifying script: ${(error as Error).message || "Unknown error"}`
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copied!",
        description: "Script code copied to clipboard",
      });
    });
  };

  // Check for script URL on mount and update active tab if needed
  useEffect(() => {
    checkScriptExists();
    
    // Ensure activeTab is valid (in case it was set to "customization" previously)
    if (activeTab === "customization") {
      setActiveTab("installation");
    }
  }, []);

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="px-0 py-4 flex justify-between items-center">
          <TabsList className="gap-4 bg-transparent p-0">
            <TabsTrigger 
              value="installation" 
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-gray-900 data-[state=active]:border-gray-900 data-[state=active]:border-b-2 rounded-none px-1 py-3 text-gray-600 hover:text-gray-900"
            >
              <Code className="h-4 w-4 mr-2" />
              Installation
            </TabsTrigger>
            <TabsTrigger 
              value="analytics" 
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-gray-900 data-[state=active]:border-gray-900 data-[state=active]:border-b-2 rounded-none px-1 py-3 text-gray-600 hover:text-gray-900"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics Tracking
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="installation" className="px-0 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <span>Integration Status</span>
                {scriptUrl ? (
                  <span className="ml-2 px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Active</span>
                ) : (
                  <span className="ml-2 px-2 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800">Setup Required</span>
                )}
              </CardTitle>
              <CardDescription>
                Follow these steps to integrate UTM tracking with your website
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col space-y-6">
                <div className="flex items-start">
                  <div className="bg-gray-900 text-white flex items-center justify-center rounded-full w-8 h-8 mt-0.5 mr-4 flex-shrink-0">
                    1
                  </div>
                  <div>
                    <h3 className="text-base font-medium mb-2">Upload the tracking script</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      First, deploy the tracking script to our secure CDN so it can be loaded by your website.
                    </p>
                    <Button 
                      onClick={uploadScript} 
                      disabled={isUploadingScript}
                      variant="default"
                      className="bg-gray-900 text-white hover:bg-gray-800"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {isUploadingScript ? "Uploading..." : scriptUrl ? "Update Script" : "Upload Script"}
                    </Button>
                    {scriptUrl && (
                      <p className="mt-2 text-xs text-green-600">
                        ✓ Script uploaded successfully
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-start">
                  <div className={`${scriptUrl ? 'bg-gray-900' : 'bg-gray-300'} text-white flex items-center justify-center rounded-full w-8 h-8 mt-0.5 mr-4 flex-shrink-0`}>
                    2
                  </div>
                  <div className={scriptUrl ? '' : 'opacity-70'}>
                    <h3 className="text-base font-medium mb-2">Add the script to your website</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Copy the script tag below and add it to the <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">&lt;head&gt;</code> section of your website.
                    </p>
                    <div className="bg-gray-100 p-3 rounded-md mb-4 relative font-mono text-sm overflow-x-auto">
                      <CopyToClipboard text={generateScriptTag()} onCopy={handleCopy}>
                        <Button
                          variant="ghost"
                          className="absolute right-2 top-2 h-8 w-8 p-0"
                          aria-label="Copy code"
                          disabled={!scriptUrl}
                        >
                          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </CopyToClipboard>
                      <code>{generateScriptTag()}</code>
                    </div>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className={`${scriptUrl ? 'bg-gray-900' : 'bg-gray-300'} text-white flex items-center justify-center rounded-full w-8 h-8 mt-0.5 mr-4 flex-shrink-0`}>
                    3
                  </div>
                  <div className={scriptUrl ? '' : 'opacity-70'}>
                    <h3 className="text-base font-medium mb-2">Verify your installation</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Enter your website URL to verify that the script is properly installed.
                    </p>
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="https://yourdomain.com"
                        value={domain}
                        onChange={(e) => setDomain(e.target.value)}
                        className="max-w-xs"
                        disabled={!scriptUrl}
                      />
                      <Button 
                        variant="outline" 
                        onClick={verifyScriptInstallation} 
                        disabled={isVerifying || !domain || !scriptUrl}
                      >
                        {isVerifying ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Verifying...
                          </>
                        ) : (
                          "Verify"
                        )}
                      </Button>
                    </div>
                    {verificationResult && (
                      <Alert className={`mt-4 ${verificationResult.success ? "bg-green-50" : "bg-red-50"}`}>
                        {verificationResult.success ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Info className="h-4 w-4 text-red-600" />
                        )}
                        <AlertTitle>{verificationResult.success ? "Success!" : "Installation Issue"}</AlertTitle>
                        <AlertDescription>{verificationResult.message}</AlertDescription>
                      </Alert>
                    )}
                  </div>
                </div>

                <div className="flex items-start">
                  <div className={`${scriptUrl ? 'bg-gray-900' : 'bg-gray-300'} text-white flex items-center justify-center rounded-full w-8 h-8 mt-0.5 mr-4 flex-shrink-0`}>
                    4
                  </div>
                  <div className={scriptUrl ? '' : 'opacity-70'}>
                    <h3 className="text-base font-medium mb-2">Test your tracking</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Use the test link below to verify that UTM parameters are being tracked correctly.
                    </p>
                    <div className="flex items-center space-x-2">
                      <Input 
                        readOnly 
                        value={domain ? `${domain}?utm_source=test&utm_medium=test&utm_campaign=test` : "https://yourdomain.com/?utm_source=test&utm_medium=test&utm_campaign=test"} 
                        className="max-w-lg font-mono text-sm"
                        disabled={!scriptUrl}
                      />
                      <Button 
                        variant="outline" 
                        className="shrink-0"
                        onClick={() => window.open(`${domain}?utm_source=test&utm_medium=test&utm_campaign=test`, '_blank')}
                        disabled={!domain || !scriptUrl}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open Test Link
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {bucketError && (
            <Alert variant="destructive">
              <AlertTitle>Storage Configuration Required</AlertTitle>
              <AlertDescription>
                <div className="space-y-2">
                  <p>{bucketError}</p>
                  {bucketError.includes("doesn't exist") && (
                    <div className="mt-2 text-sm">
                      <p className="font-semibold">How to fix this:</p>
                      <ol className="list-decimal pl-4 mt-1 space-y-1">
                        <li>Log in to your <a href="https://app.supabase.com" target="_blank" className="underline">Supabase Dashboard</a></li>
                        <li>Navigate to Storage in the left sidebar</li>
                        <li>Click "New Bucket" and create one named "scripts"</li>
                        <li>Make sure to set it as a public bucket</li>
                        <li>Set up appropriate policies for authenticated uploads</li>
                      </ol>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="px-0 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Analytics Tracking</CardTitle>
              <CardDescription>
                Manage your UTM parameter tracking and analytics integrations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6">
                <div className="border rounded-md p-4">
                  <h3 className="text-sm font-medium mb-2">Available Tracking Scripts</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                      <div>
                        <h4 className="font-medium">Standard Tracking</h4>
                        <p className="text-sm text-gray-500">Basic UTM parameter and page visit tracking</p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open('/utm-content-magic/analytics/tracking-script', '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Script
                      </Button>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                      <div>
                        <h4 className="font-medium">Webflow Integration</h4>
                        <p className="text-sm text-gray-500">Specialized script for Webflow websites</p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setScriptModalOpen(true)}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Script
                      </Button>
                    </div>
                  </div>
                </div>
                
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Analytics Dashboard</AlertTitle>
                  <AlertDescription>
                    <p className="mb-2">View your UTM parameter analytics in the Analytics dashboard.</p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open('/utm-content-magic/analytics', '_blank')}
                    >
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Open Analytics
                    </Button>
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Webflow Script Modal */}
      <Dialog open={scriptModalOpen} onOpenChange={setScriptModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Webflow Integration Script</DialogTitle>
            <DialogDescription>
              Add these scripts to your Webflow site to track user journeys and interactions
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 mt-4">
            <p className="text-sm text-muted-foreground">
              Webflow requires adding scripts in two places - one in the HEAD and one before the end of the BODY.
              Follow the instructions below to add both scripts to your Webflow site.
            </p>
            
            <Tabs value={scriptModalTab} onValueChange={(value) => setScriptModalTab(value as 'head' | 'body')}>
              <TabsList className="mb-4">
                <TabsTrigger value="head">HEAD Script</TabsTrigger>
                <TabsTrigger value="body">BODY Script</TabsTrigger>
              </TabsList>
              
              <TabsContent value="head">
                <div className="bg-muted p-4 rounded-md mb-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs text-muted-foreground">Add to your HEAD section (Project Settings → Custom Code → Head Code)</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(webflowHeadScript)}
                      className="h-8 w-8"
                    >
                      {copied ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <ClipboardIcon className="h-4 w-4" />}
                    </Button>
                  </div>
                  <pre className="overflow-x-auto p-2 text-xs bg-black text-white rounded">
                    <code>{webflowHeadScript}</code>
                  </pre>
                </div>
                
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-md">
                  <p className="text-sm text-amber-800">
                    <strong>Important:</strong> This code must be added to the HEAD section of your Webflow site.
                    You'll also need to add the BODY script below.
                  </p>
                </div>
              </TabsContent>
              
              <TabsContent value="body">
                <div className="bg-muted p-4 rounded-md mb-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs text-muted-foreground">Add to your BODY section (Project Settings → Custom Code → Footer Code)</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(webflowBodyScript)}
                      className="h-8 w-8"
                    >
                      {copied ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <ClipboardIcon className="h-4 w-4" />}
                    </Button>
                  </div>
                  <pre className="overflow-x-auto p-2 text-xs bg-black text-white rounded">
                    <code>{webflowBodyScript}</code>
                  </pre>
                </div>
                
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-md">
                  <p className="text-sm text-amber-800">
                    <strong>Important:</strong> This code must be added to the BODY/Footer section of your Webflow site.
                    Make sure you've also added the HEAD script above.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="bg-muted p-4 rounded-md">
              <h3 className="font-medium mb-2">Installation Guide</h3>
              <ol className="list-decimal list-inside space-y-3 text-sm">
                <li className="pb-2">
                  <span className="font-medium">Access your Webflow project settings:</span>
                  <ul className="list-disc list-inside ml-6 mt-1 text-muted-foreground">
                    <li>Open your Webflow project dashboard</li>
                    <li>Click the gear icon ⚙️ for Project Settings</li>
                    <li>Navigate to "Custom Code" section</li>
                  </ul>
                </li>
                <li className="pb-2">
                  <span className="font-medium">Add the HEAD script to the "Head Code" section</span>
                </li>
                <li className="pb-2">
                  <span className="font-medium">Add the BODY script to the "Footer Code" section</span>
                </li>
                <li>
                  <span className="font-medium">Save and publish your site</span>
                </li>
              </ol>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ScriptIntegration;
