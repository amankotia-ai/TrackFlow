// UTM Content Magic Script
(function() {
  // Add a timestamp for cache busting in development
  const SCRIPT_VERSION = '1.4.0';
  console.log(`UTM Content Magic v${SCRIPT_VERSION} initializing...`);

  // Get the current script tag
  const scripts = document.getElementsByTagName('script');
  const currentScript = scripts[scripts.length - 1];
  
  // Extract project ID from the script URL
  const scriptUrl = currentScript.src;
  const projectIdMatch = scriptUrl.match(/\/\/([^.]+)/);
  const projectId = projectIdMatch ? projectIdMatch[1] : null;
  
  if (!projectId) {
    console.error('UTM Content Magic: Could not determine project ID');
    return;
  }
  
  // Session and storage management
  const LOCAL_STORAGE_KEYS = {
    CLIENT_ID: 'utm_magic_client_id',
    FIRST_UTM_SOURCE: 'utm_magic_first_source',
    FIRST_UTM_MEDIUM: 'utm_magic_first_medium',
    FIRST_UTM_CAMPAIGN: 'utm_magic_first_campaign',
    FIRST_UTM_TERM: 'utm_magic_first_term',
    FIRST_UTM_CONTENT: 'utm_magic_first_content',
    LAST_UTM_SOURCE: 'utm_magic_last_source',
    LAST_UTM_MEDIUM: 'utm_magic_last_medium',
    LAST_UTM_CAMPAIGN: 'utm_magic_last_campaign',
    LAST_UTM_TERM: 'utm_magic_last_term',
    LAST_UTM_CONTENT: 'utm_magic_last_content',
    SESSION_ID: 'utm_magic_session_id',
    VISIT_COUNT: 'utm_magic_visit_count',
    LAST_ACTIVITY: 'utm_magic_last_activity',
    PENDING_EVENTS: 'utm_magic_pending_events'
  };
  
  const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds
  
  // Generate a client ID for tracking if not exists
  const generateClientId = () => {
    let clientId = localStorage.getItem(LOCAL_STORAGE_KEYS.CLIENT_ID);
    if (!clientId) {
      clientId = 'utm_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      localStorage.setItem(LOCAL_STORAGE_KEYS.CLIENT_ID, clientId);
    }
    return clientId;
  };
  
  // Generate or retrieve the session ID
  const getSessionId = () => {
    let sessionId = sessionStorage.getItem(LOCAL_STORAGE_KEYS.SESSION_ID);
    const lastActivity = localStorage.getItem(LOCAL_STORAGE_KEYS.LAST_ACTIVITY);
    
    // Check if we need a new session
    const needNewSession = !sessionId || 
                          !lastActivity || 
                          (Date.now() - parseInt(lastActivity, 10)) > SESSION_TIMEOUT;
    
    if (needNewSession) {
      sessionId = 'sess_' + Math.random().toString(36).substring(2, 15);
      sessionStorage.setItem(LOCAL_STORAGE_KEYS.SESSION_ID, sessionId);
      
      // Update visit count
      const visitCount = parseInt(localStorage.getItem(LOCAL_STORAGE_KEYS.VISIT_COUNT) || '0', 10) + 1;
      localStorage.setItem(LOCAL_STORAGE_KEYS.VISIT_COUNT, visitCount.toString());
    }
    
    // Update last activity
    localStorage.setItem(LOCAL_STORAGE_KEYS.LAST_ACTIVITY, Date.now().toString());
    
    return sessionId;
  };
  
  // Save UTM parameters to storage
  const saveUtmParameters = (params) => {
    const utmParams = {
      utm_source: params.utm_source,
      utm_medium: params.utm_medium,
      utm_campaign: params.utm_campaign,
      utm_term: params.utm_term,
      utm_content: params.utm_content
    };
    
    // Save as last UTM parameters
    Object.keys(utmParams).forEach(key => {
      if (utmParams[key]) {
        const storageKey = LOCAL_STORAGE_KEYS[`LAST_${key.toUpperCase()}`];
        localStorage.setItem(storageKey, utmParams[key]);
      }
    });
    
    // Save as first UTM parameters if they don't exist
    Object.keys(utmParams).forEach(key => {
      const firstStorageKey = LOCAL_STORAGE_KEYS[`FIRST_${key.toUpperCase()}`];
      if (utmParams[key] && !localStorage.getItem(firstStorageKey)) {
        localStorage.setItem(firstStorageKey, utmParams[key]);
      }
    });
  };
  
  // Get saved UTM parameters
  const getSavedUtmParameters = () => {
    return {
      first_utm_source: localStorage.getItem(LOCAL_STORAGE_KEYS.FIRST_UTM_SOURCE) || null,
      first_utm_medium: localStorage.getItem(LOCAL_STORAGE_KEYS.FIRST_UTM_MEDIUM) || null,
      first_utm_campaign: localStorage.getItem(LOCAL_STORAGE_KEYS.FIRST_UTM_CAMPAIGN) || null,
      first_utm_term: localStorage.getItem(LOCAL_STORAGE_KEYS.FIRST_UTM_TERM) || null,
      first_utm_content: localStorage.getItem(LOCAL_STORAGE_KEYS.FIRST_UTM_CONTENT) || null,
      last_utm_source: localStorage.getItem(LOCAL_STORAGE_KEYS.LAST_UTM_SOURCE) || null,
      last_utm_medium: localStorage.getItem(LOCAL_STORAGE_KEYS.LAST_UTM_MEDIUM) || null,
      last_utm_campaign: localStorage.getItem(LOCAL_STORAGE_KEYS.LAST_UTM_CAMPAIGN) || null,
      last_utm_term: localStorage.getItem(LOCAL_STORAGE_KEYS.LAST_UTM_TERM) || null,
      last_utm_content: localStorage.getItem(LOCAL_STORAGE_KEYS.LAST_UTM_CONTENT) || null
    };
  };
  
  // Function to store pending events that failed to send
  const storePendingEvent = (trackingData) => {
    try {
      let pendingEvents = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.PENDING_EVENTS) || '[]');
      pendingEvents.push({
        data: trackingData,
        timestamp: Date.now()
      });
      
      // Keep only last 10 events to avoid storage issues
      if (pendingEvents.length > 10) {
        pendingEvents = pendingEvents.slice(-10);
      }
      
      localStorage.setItem(LOCAL_STORAGE_KEYS.PENDING_EVENTS, JSON.stringify(pendingEvents));
      return true;
    } catch (error) {
      console.error('UTM Content Magic: Error storing pending event:', error);
      return false;
    }
  };
  
  // Function to retry sending pending events
  const retryPendingEvents = async () => {
    try {
      const pendingEvents = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.PENDING_EVENTS) || '[]');
      if (!pendingEvents.length) return;
      
      console.log(`UTM Content Magic: Retrying ${pendingEvents.length} pending events`);
      
      // Create a copy to track successful events
      const successfulEvents = [];
      
      for (const event of pendingEvents) {
        // Skip events older than 24 hours
        if (Date.now() - event.timestamp > 86400000) {
          successfulEvents.push(event);
          continue;
        }
        
        try {
          const trackingUrl = `https://${projectId}.supabase.co/functions/v1/utm-tracking`;
          const response = await fetch(trackingUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(event.data),
            credentials: 'omit'
          });
          
          if (response.ok) {
            successfulEvents.push(event);
            console.log('UTM Content Magic: Successfully resent event');
          }
        } catch (error) {
          console.error('UTM Content Magic: Error retrying event:', error);
        }
      }
      
      // Remove successful events from pending list
      if (successfulEvents.length) {
        const remainingEvents = pendingEvents.filter(event => !successfulEvents.includes(event));
        localStorage.setItem(LOCAL_STORAGE_KEYS.PENDING_EVENTS, JSON.stringify(remainingEvents));
      }
    } catch (error) {
      console.error('UTM Content Magic: Error processing pending events:', error);
    }
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
  const trackUtmParameters = async (params, eventType = 'pageview') => {
    try {
      const clientId = generateClientId();
      const sessionId = getSessionId();
      const visitCount = parseInt(localStorage.getItem(LOCAL_STORAGE_KEYS.VISIT_COUNT) || '1', 10);
      const trackingUrl = `https://${projectId}.supabase.co/functions/v1/utm-tracking`;
      
      // Check for UTM parameters and save them if present
      const hasUtmParams = Object.keys(params).some(key => key.startsWith('utm_'));
      if (hasUtmParams) {
        saveUtmParameters(params);
      }
      
      // Get stored UTM parameters to include in tracking
      const savedUtmParams = getSavedUtmParameters();
      
      // Prepare tracking data
      const trackingData = {
        ...params,
        ...savedUtmParams,
        page_url: window.location.href,
        page_title: document.title,
        referrer: document.referrer,
        client_id: clientId,
        session_id: sessionId,
        visit_count: visitCount,
        event_type: eventType,
        screen_width: window.screen.width,
        screen_height: window.screen.height,
        browser_language: navigator.language || navigator.userLanguage,
        timestamp: new Date().toISOString()
      };
      
      console.log('UTM Content Magic: Sending tracking data', trackingData);
      
      let success = false;
      
      // Use Beacon API if available for reliable tracking, even on page exit
      if (navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify(trackingData)], { type: 'application/json' });
        success = navigator.sendBeacon(trackingUrl, blob);
        console.log('UTM Content Magic: Tracking data sent via Beacon API, success:', success);
      } 
      
      // Fallback to fetch API if Beacon API failed or isn't available
      if (!success) {
        try {
          const response = await fetch(trackingUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(trackingData),
            // Use keepalive to ensure the request completes, even on page exit
            keepalive: true,
            // Explicitly omit credentials to avoid CORS issues
            credentials: 'omit'
          });
          
          success = response.ok;
          
          if (success) {
            console.log('UTM Content Magic: Tracking data sent via Fetch API');
          } else {
            console.error('UTM Content Magic: Error sending tracking data:', await response.text());
          }
        } catch (error) {
          console.error('UTM Content Magic: Error sending tracking data with fetch:', error);
          success = false;
        }
      }
      
      // Store as pending event if sending failed
      if (!success) {
        console.log('UTM Content Magic: Storing event to retry later');
        storePendingEvent(trackingData);
      } else {
        // If success, attempt to retry any pending events
        setTimeout(retryPendingEvents, 2000);
      }
      
      return success;
    } catch (error) {
      console.error('UTM Content Magic: Error in trackUtmParameters:', error);
      return false;
    }
  };
  
  // Function to track events (like clicks, form submissions, etc.)
  const trackEvent = async (eventName, eventProperties = {}) => {
    try {
      const params = {
        ...getUrlParams(),
        event_name: eventName,
        ...eventProperties
      };
      
      return await trackUtmParameters(params, 'event');
    } catch (error) {
      console.error('UTM Content Magic: Error tracking event:', error);
      return false;
    }
  };
  
  // Function to check if a rule's conditions match the UTM parameters
  const matchesCondition = (rule, params) => {
    if (!rule || !rule.condition_type || !rule.condition_value) return false;
    
    // Get the UTM parameter that corresponds to the rule's condition type
    const utmValue = params[rule.condition_type];
    
    // Rule matches only if the UTM parameter exists and matches the condition value
    return utmValue && utmValue === rule.condition_value;
  };
  
  // Helper function to try multiple approaches for updating button content
  const updateButtonContent = (button, content) => {
    const approaches = [
      // Approach 1: Direct textContent replacement
      () => { button.textContent = content; },
      
      // Approach 2: innerText replacement
      () => { button.innerText = content; },
      
      // Approach 3: Using childNodes
      () => { 
        while (button.firstChild) {
          button.removeChild(button.firstChild);
        }
        button.appendChild(document.createTextNode(content));
      },
      
      // Approach 4: Using replaceChildren
      () => { button.replaceChildren(document.createTextNode(content)); }
    ];
    
    // Try each approach until one works
    for (let i = 0; i < approaches.length; i++) {
      try {
        approaches[i]();
        console.log(`UTM Content Magic: Button update successful with approach #${i+1}`);
        return true;
      } catch (e) {
        console.log(`UTM Content Magic: Button update approach #${i+1} failed: ${e.message}`);
      }
    }
    
    console.error('UTM Content Magic: All button update approaches failed');
    return false;
  };
  
  // Function to safely apply a single CSS selector
  const applySingleSelector = (selector, replacement) => {
    // Safety check
    if (typeof selector !== 'string' || !selector.trim()) {
      console.error('UTM Content Magic: Invalid selector:', selector);
      return false;
    }
    
    try {
      console.log(`UTM Content Magic: Applying selector "${selector}"`);
      const elements = document.querySelectorAll(selector);
      
      if (!elements.length) {
        console.error(`UTM Content Magic: No elements found for selector "${selector}"`);
        return false;
      }
      
      console.log(`UTM Content Magic: Found ${elements.length} elements matching selector "${selector}"`);
      
      elements.forEach((element, index) => {
        console.log(`UTM Content Magic: Element ${index+1} is a <${element.tagName.toLowerCase()}> with classes: ${element.className}`);
        
        const tagName = element.tagName.toLowerCase();
        
        // Keep original content for debugging
        const originalContent = element.innerHTML || element.textContent || element.value || '';
        
        // Handle different element types appropriately
        if (tagName === 'button') {
          console.log(`UTM Content Magic: Button element detected, modifying text content`);
          
          // Strip HTML tags for button content
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = replacement || '';
          const plainText = tempDiv.textContent || '';
          
          // Use our helper function to try multiple approaches
          const success = updateButtonContent(element, plainText);
          
          if (success) {
            console.log(`UTM Content Magic: Button changed from "${originalContent}" to "${plainText}"`);
          }
        } 
        else if (tagName === 'input') {
          // Handle input elements
          console.log(`UTM Content Magic: Input element detected, type=${element.type}`);
          
          // Strip HTML for input value
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = replacement || '';
          const plainText = tempDiv.textContent || '';
          
          // Special handling for submit inputs (they show text like buttons)
          if (element.type === 'submit' || element.type === 'button') {
            console.log(`UTM Content Magic: Submit/button input detected, modifying value attribute`);
            element.value = plainText;
            
            // In addition to value, try setting other related attributes that may affect display
            try {
              // Some frameworks/libraries use data attributes for button text
              element.setAttribute('data-text', plainText);
              element.setAttribute('aria-label', plainText);
              
              // If there's a data-wait attribute (for loading state), preserve it
              if (element.hasAttribute('data-wait')) {
                const waitText = element.getAttribute('data-wait');
                element.setAttribute('data-original-text', plainText);
                console.log(`UTM Content Magic: Preserved data-wait="${waitText}" and set data-original-text="${plainText}"`);
              }
            } catch (attrError) {
              console.error(`UTM Content Magic: Error setting additional attributes: ${attrError.message}`);
            }
          } else {
            // For regular inputs (text, email, etc.)
            element.value = plainText;
          }
          
          console.log(`UTM Content Magic: Input value changed from "${originalContent}" to "${element.value}"`);
        }
        else {
          // Use innerHTML for other elements
          try {
            element.innerHTML = replacement || '';
            console.log(`UTM Content Magic: Element content changed successfully`);
          } catch (error) {
            console.error(`UTM Content Magic: Error setting innerHTML: ${error.message}, trying textContent`);
            
            // Fallback to textContent
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = replacement || '';
            element.textContent = tempDiv.textContent || '';
          }
        }
      });
      
      console.log(`UTM Content Magic: Replaced content for selector "${selector}"`);
      return true;
    } catch (error) {
      console.error(`UTM Content Magic: Error applying selector "${selector}":`, error);
      return false;
    }
  };
  
  // Function to apply content rules
  const applyContentRules = (rules, params) => {
    if (!rules || !rules.length) {
      console.log('UTM Content Magic: No rules to apply');
      return;
    }
    
    console.log(`UTM Content Magic: Processing ${rules.length} rules with URL params:`, params);
    console.log('UTM Content Magic: Rules to process:', JSON.stringify(rules, null, 2));
    
    let appliedCount = 0;
    let failedCount = 0;
    
    rules.forEach((rule, index) => {
      try {
        console.log(`UTM Content Magic: Processing rule #${index + 1}: "${rule.name || 'Unnamed Rule'}"`);
        
        // First check if the rule's condition matches the UTM parameters
        if (!matchesCondition(rule, params)) {
          console.log(`UTM Content Magic: Rule #${index + 1} condition does not match current UTM parameters`, 
            { condition_type: rule.condition_type, condition_value: rule.condition_value, params });
          return;
        }
        
        console.log(`UTM Content Magic: Rule #${index + 1} matched condition ${rule.condition_type}=${rule.condition_value}`);
        
        if (!rule.selector) {
          console.error(`UTM Content Magic: Rule #${index + 1} has no selector defined`);
          failedCount++;
          return;
        }
        
        // Simple approach - just try to use the selector as is
        if (applySingleSelector(rule.selector, rule.replacement_content)) {
          appliedCount++;
          console.log(`UTM Content Magic: Rule #${index + 1} applied successfully`);
        } else {
          failedCount++;
          console.error(`UTM Content Magic: Rule #${index + 1} failed to apply`);
        }
      } catch (error) {
        failedCount++;
        console.error(`UTM Content Magic: Error processing rule #${index + 1}:`, error);
      }
    });
    
    console.log(`UTM Content Magic: Applied ${appliedCount} rules, failed ${failedCount} rules, out of ${rules.length} total rules`);
  };
  
  // Main init function
  const init = async () => {
    try {
      const params = getUrlParams();
      console.log('UTM Content Magic: URL params:', params);
      
      // Always track pageviews, even if there are no UTM parameters
      await trackUtmParameters(params, 'pageview');
      
      const hasUtmParams = Object.keys(params).some(key => key.startsWith('utm_'));
      
      if (!hasUtmParams) {
        console.log('UTM Content Magic: No UTM parameters found - checking for stored values');
        
        // Check for stored UTM values to apply rules
        const storedValues = getSavedUtmParameters();
        const hasStoredUtmValues = Object.values(storedValues).some(val => val !== null);
        
        if (!hasStoredUtmValues) {
          console.log('UTM Content Magic: No stored UTM values found either');
          return;
        }
        
        // Merge stored values with current params for rule matching
        Object.keys(storedValues).forEach(key => {
          if (storedValues[key] && key.includes('utm_')) {
            // Extract the actual UTM param name (removing first_ or last_ prefix)
            const utmKey = key.replace('first_', '').replace('last_', '');
            if (!params[utmKey]) {
              params[utmKey] = storedValues[key];
            }
          }
        });
      }
      
      const apiUrl = `https://${projectId}.supabase.co/functions/v1/utm-content`;
      const queryString = new URLSearchParams(params).toString();
      
      console.log(`UTM Content Magic: Fetching rules from ${apiUrl}?${queryString}`);
      
      const response = await fetch(`${apiUrl}?${queryString}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('UTM Content Magic: Received data:', data);
      
      if (data && data.rules && data.rules.length > 0) {
        // Apply rules immediately
        applyContentRules(data.rules, params);
        
        // Set up a MutationObserver to handle dynamically added elements
        setupMutationObserver(data.rules, params);
      } else {
        console.log('UTM Content Magic: No matching rules found');
      }
    } catch (error) {
      console.error('UTM Content Magic: Error initializing:', error);
    }
  };
  
  // Function to set up a MutationObserver to watch for DOM changes
  const setupMutationObserver = (rules, params) => {
    // Only set up mutation observer if we have button or input submit rules
    const hasButtonOrSubmitRules = rules.some(rule => 
      rule.selector && (
        rule.selector.toLowerCase().includes('button') ||
        rule.selector.toLowerCase().includes('input[type="submit"]') ||
        rule.selector.toLowerCase().includes('input[type=submit]') ||
        rule.selector.toLowerCase().includes('.w-button') ||
        rule.selector.toLowerCase().includes('email-form-submission')
      )
    );
    
    if (!hasButtonOrSubmitRules) {
      console.log('UTM Content Magic: No button or submit input rules found, skipping MutationObserver');
      return;
    }
    
    console.log('UTM Content Magic: Setting up MutationObserver for dynamic elements');
    
    // Create an observer instance
    const observer = new MutationObserver((mutations) => {
      let shouldReapply = false;
      
      // Check if any relevant elements were added
      mutations.forEach(mutation => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === 1) { // Element node
              // Check for direct match
              if (node.tagName) {
                const tagName = node.tagName.toLowerCase();
                if (tagName === 'button' || 
                    (tagName === 'input' && node.type === 'submit')) {
                  shouldReapply = true;
                  console.log(`UTM Content Magic: Detected new ${tagName} element`);
                }
              }
              
              // Check for child elements
              if (node.querySelectorAll) {
                const buttons = node.querySelectorAll('button, input[type="submit"]');
                if (buttons.length > 0) {
                  shouldReapply = true;
                  console.log(`UTM Content Magic: Detected ${buttons.length} new button/submit elements within added content`);
                }
              }
            }
          });
        }
      });
      
      // If relevant elements were added, reapply the rules
      if (shouldReapply) {
        console.log('UTM Content Magic: New button/submit elements detected, reapplying rules');
        applyContentRules(rules, params);
      }
    });
    
    // Start observing the document with the configured parameters
    observer.observe(document.body, { 
      childList: true, 
      subtree: true 
    });
    
    console.log('UTM Content Magic: MutationObserver started');
  };
  
  // Setup event tracking for important user interactions
  const setupEventTracking = () => {
    // Track form submissions
    document.addEventListener('submit', function(event) {
      if (event.target && event.target.tagName === 'FORM') {
        const formId = event.target.id || 'unknown_form';
        const formAction = event.target.action || 'unknown_action';
        trackEvent('form_submission', { form_id: formId, form_action: formAction });
      }
    }, true);
    
    // Track clicks on buttons and links with specific classes/attributes
    document.addEventListener('click', function(event) {
      // Find the clicked element or its closest trackable parent
      let target = event.target;
      let trackElement = null;
      
      // Check if we clicked a trackable element or its child
      while (target && target !== document) {
        // Check if this is a button, anchor, or has tracking attributes
        if (target.tagName === 'BUTTON' || 
            target.tagName === 'A' || 
            target.hasAttribute('data-utm-track') ||
            target.classList.contains('utm-track')) {
          trackElement = target;
          break;
        }
        target = target.parentElement;
      }
      
      if (trackElement) {
        const elementType = trackElement.tagName.toLowerCase();
        const elementId = trackElement.id || null;
        const href = trackElement.href || null;
        const text = trackElement.innerText || trackElement.textContent || null;
        const classes = Array.from(trackElement.classList).join(',');
        
        trackEvent('click', { 
          element_type: elementType, 
          element_id: elementId,
          element_text: text,
          element_href: href,
          element_classes: classes
        });
      }
    }, true);
  };
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    console.log('UTM Content Magic: Document still loading, waiting for DOMContentLoaded event');
    document.addEventListener('DOMContentLoaded', () => {
      init();
      setupEventTracking();
    });
  } else {
    console.log('UTM Content Magic: Document already loaded, initializing immediately');
    init();
    setupEventTracking();
  }
  
  // Setup activity tracking to maintain session
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      // User returned to the page - update session if needed
      getSessionId();
    }
  });
  
  // Update last activity periodically
  setInterval(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.LAST_ACTIVITY, Date.now().toString());
  }, 60000); // Update every minute
  
  // Retry sending pending events on page visibility change
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      retryPendingEvents();
    }
  });
  
  // Expose API for custom event tracking
  window.utmMagic = {
    trackEvent,
    trackPageview: (customParams = {}) => trackUtmParameters({...getUrlParams(), ...customParams}, 'pageview')
  };
  
  // Expose testing API
  window.utmContentMagicTestExport = {
    applyContentRules,
    applySingleSelector,
    trackUtmParameters,
    getSavedUtmParameters
  };
  
  console.log('UTM Content Magic: Script fully loaded and initialized');
})();
