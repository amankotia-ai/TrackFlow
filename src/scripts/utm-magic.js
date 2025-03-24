
// UTM Content Magic Script
(function() {
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
  
  // Function to get URL parameters
  const getUrlParams = () => {
    const params = {};
    window.location.search.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(_, key, value) {
      params[key] = decodeURIComponent(value);
    });
    return params;
  };
  
  // Function to check if a rule's conditions match the UTM parameters
  const matchesCondition = (rule, params) => {
    if (!rule || !rule.condition_type || !rule.condition_value) return false;
    
    // Get the UTM parameter that corresponds to the rule's condition type
    const utmValue = params[rule.condition_type];
    
    // Rule matches only if the UTM parameter exists and matches the condition value
    return utmValue && utmValue === rule.condition_value;
  };
  
  // Function to apply content rules
  const applyContentRules = (rules, params) => {
    if (!rules || !rules.length) return;
    
    rules.forEach(rule => {
      try {
        // First check if the rule's condition matches the UTM parameters
        if (!matchesCondition(rule, params)) {
          console.log(`UTM Content Magic: Rule "${rule.name}" condition does not match current UTM parameters`);
          return;
        }
        
        console.log(`UTM Content Magic: Rule "${rule.name}" matched condition ${rule.condition_type}=${rule.condition_value}`);
        
        const elements = document.querySelectorAll(rule.selector);
        if (!elements.length) {
          console.log(`UTM Content Magic: No elements found for selector "${rule.selector}"`);
          return;
        }
        
        elements.forEach(element => {
          // Replace content safely with innerHTML
          element.innerHTML = rule.replacement_content;
          console.log(`UTM Content Magic: Replaced content for ${rule.selector}`);
        });
      } catch (error) {
        console.error(`UTM Content Magic: Error applying rule for selector "${rule.selector}":`, error);
      }
    });
  };
  
  // Main init function
  const init = async () => {
    try {
      const params = getUrlParams();
      const hasUtmParams = Object.keys(params).some(key => key.startsWith('utm_'));
      
      if (!hasUtmParams) {
        console.log('UTM Content Magic: No UTM parameters found');
        return;
      }
      
      const apiUrl = `https://${projectId}.supabase.co/functions/v1/utm-content`;
      const queryString = new URLSearchParams(params).toString();
      
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
      
      if (data.rules && data.rules.length > 0) {
        applyContentRules(data.rules, params);
      } else {
        console.log('UTM Content Magic: No matching rules found');
      }
    } catch (error) {
      console.error('UTM Content Magic: Error initializing:', error);
    }
  };
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
