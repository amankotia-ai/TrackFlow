import { useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';

// Configuration type
type JourneyTrackerConfig = {
  projectId: string;
  trackClicks?: boolean;
  trackScrolls?: boolean;
  trackForms?: boolean;
};

// Journey tracking data
type JourneyData = {
  client_id: string;
  session_id: string;
  journey_id: string;
  page_url: string;
  page_title: string;
  previous_page_url: string | null;
  page_sequence: number;
  time_on_previous_page: number | null;
  event_type: string;
  timestamp: string;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_term?: string | null;
  utm_content?: string | null;
};

// Click data
type ClickData = {
  client_id: string;
  session_id: string;
  journey_id: string;
  page_url: string;
  x: number;
  y: number;
  element_selector: string;
  element_text: string | null;
  timestamp: string;
};

// Scroll data
type ScrollData = {
  client_id: string;
  session_id: string;
  journey_id: string;
  page_url: string;
  scroll_depth: number;
  timestamp: string;
};

// Form data
type FormData = {
  client_id: string;
  session_id: string;
  journey_id: string;
  page_url: string;
  form_id: string | null;
  form_action: string | null;
  form_fields: Array<{name: string, type: string}>;
  timestamp: string;
};

export const JourneyTracker: React.FC<JourneyTrackerConfig> = ({
  projectId,
  trackClicks = true,
  trackScrolls = true,
  trackForms = true
}) => {
  // Store timing information
  const pageEntryTime = useRef<number>(Date.now());
  const previousPage = useRef<string | null>(null);
  const sequence = useRef<number>(1);
  const lastScrollPosition = useRef<number>(0);
  const scrollDepth = useRef<number>(0);
  const currentSectionId = useRef<string | null>(null);
  
  // Generate or retrieve IDs
  const getClientId = (): string => {
    let clientId = localStorage.getItem('analytics_client_id');
    if (!clientId) {
      clientId = uuidv4();
      localStorage.setItem('analytics_client_id', clientId);
    }
    return clientId;
  };
  
  const getSessionId = (): string => {
    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = uuidv4();
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
  };
  
  const getJourneyId = (): string => {
    let journeyId = sessionStorage.getItem('analytics_journey_id');
    if (!journeyId) {
      journeyId = uuidv4();
      sessionStorage.setItem('analytics_journey_id', journeyId);
    }
    return journeyId;
  };
  
  // Extract UTM params from URL
  const getUtmParams = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return {
      utm_source: urlParams.get('utm_source'),
      utm_medium: urlParams.get('utm_medium'),
      utm_campaign: urlParams.get('utm_campaign'),
      utm_term: urlParams.get('utm_term'),
      utm_content: urlParams.get('utm_content')
    };
  };
  
  // Get the current visible section
  const getCurrentSection = () => {
    const sections = document.querySelectorAll('section, [data-section], [id]');
    if (!sections.length) return null;
    
    const visibleSections = [];
    
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i] as HTMLElement;
      const rect = section.getBoundingClientRect();
      
      // Check if the section is in the viewport
      if (rect.top < window.innerHeight && rect.bottom >= 0) {
        let visibility = 0;
        
        // Calculate how much of the section is visible
        const visibleTop = Math.max(0, rect.top);
        const visibleBottom = Math.min(window.innerHeight, rect.bottom);
        
        if (visibleBottom > visibleTop) {
          visibility = (visibleBottom - visibleTop) / rect.height;
        }
        
        if (visibility > 0.5) { // More than 50% visible
          visibleSections.push({
            id: section.id || null,
            classes: section.className || null,
            visibility: visibility
          });
        }
      }
    }
    
    if (visibleSections.length) {
      // Return the most visible section
      return visibleSections.sort((a, b) => b.visibility - a.visibility)[0];
    }
    
    return null;
  };
  
  // Track page view
  const trackPageView = async () => {
    const currentTime = Date.now();
    const timeOnPreviousPage = previousPage.current ? currentTime - pageEntryTime.current : null;
    
    const journeyData: JourneyData = {
      client_id: getClientId(),
      session_id: getSessionId(),
      journey_id: getJourneyId(),
      page_url: window.location.href,
      page_title: document.title,
      previous_page_url: previousPage.current,
      page_sequence: sequence.current,
      time_on_previous_page: timeOnPreviousPage,
      event_type: 'pageview',
      timestamp: new Date().toISOString(),
      ...getUtmParams()
    };
    
    // Reset for next page
    pageEntryTime.current = currentTime;
    previousPage.current = window.location.href;
    sequence.current += 1;
    
    // Reset scroll tracking
    lastScrollPosition.current = 0;
    scrollDepth.current = 0;
    currentSectionId.current = null;
    
    // Send to tracking endpoint
    await sendTrackingData(journeyData);
  };
  
  // Track click events
  const handleClickEvent = (e: MouseEvent) => {
    if (!trackClicks) return;
    
    // Get the element that was clicked
    const element = e.target as HTMLElement;
    let clickTarget = null;
    
    // Try to find the most relevant clickable parent
    let currentElement = element;
    while (currentElement && currentElement !== document.body) {
      if (currentElement.tagName === 'A' || 
          currentElement.tagName === 'BUTTON' || 
          currentElement.getAttribute('role') === 'button' ||
          currentElement.hasAttribute('data-track-click') ||
          currentElement.classList.contains('btn') ||
          currentElement.classList.contains('button')) {
        clickTarget = currentElement;
        break;
      }
      currentElement = currentElement.parentElement as HTMLElement;
    }
    
    if (!clickTarget) clickTarget = element;
    
    let selector = '';
    let text = null;
    let section = null;
    
    // Generate a useful selector
    if (clickTarget.id) {
      selector = `#${clickTarget.id}`;
    } else if (clickTarget.classList && clickTarget.classList.length > 0) {
      selector = `.${Array.from(clickTarget.classList).join('.')}`;
    } else {
      selector = clickTarget.tagName.toLowerCase();
    }
    
    // Get the text content if it exists
    if (clickTarget.textContent) {
      text = clickTarget.textContent.trim().substring(0, 100);
    }
    
    // Find the section this element is in
    currentElement = clickTarget;
    while (currentElement && currentElement !== document.body) {
      if (currentElement.tagName === 'SECTION' || 
          currentElement.hasAttribute('data-section') ||
          currentElement.id) {
        section = {
          id: currentElement.id || null,
          type: currentElement.tagName.toLowerCase(),
          classes: currentElement.className || null
        };
        break;
      }
      currentElement = currentElement.parentElement as HTMLElement;
    }
    
    const href = clickTarget.tagName === 'A' ? clickTarget.getAttribute('href') : null;
    
    const clickData: ClickData = {
      client_id: getClientId(),
      session_id: getSessionId(),
      journey_id: getJourneyId(),
      page_url: window.location.href,
      x: e.pageX,
      y: e.pageY,
      element_selector: selector,
      element_text: text,
      timestamp: new Date().toISOString()
    };
    
    // Add additional attributes
    const enhancedData = {
      ...clickData,
      element_href: href,
      element_section: section,
      element_tag: clickTarget.tagName.toLowerCase(),
      element_classes: clickTarget.className || null,
    };
    
    sendTrackingData(enhancedData, 'click');
  };
  
  // Track form submissions
  const handleFormSubmit = (e: SubmitEvent) => {
    if (!trackForms) return;
    
    const form = e.target as HTMLFormElement;
    const formId = form.id || null;
    const formAction = form.getAttribute('action') || null;
    const formClasses = form.className || null;
    
    // Get form fields (without values for privacy)
    const fields = [];
    const formElements = form.elements;
    
    for (let i = 0; i < formElements.length; i++) {
      const field = formElements[i] as HTMLInputElement;
      if (field.name) {
        fields.push({
          name: field.name,
          type: field.type || field.tagName.toLowerCase()
        });
      }
    }
    
    const formData: FormData = {
      client_id: getClientId(),
      session_id: getSessionId(),
      journey_id: getJourneyId(),
      page_url: window.location.href,
      form_id: formId,
      form_action: formAction,
      form_fields: fields,
      timestamp: new Date().toISOString()
    };
    
    sendTrackingData(formData, 'form_submit');
  };
  
  // Track scrolling and sections
  const handleScroll = () => {
    if (!trackScrolls) return;
    
    // Don't track every scroll event, throttle it
    if (Date.now() - lastScrollPosition.current < 1000) return;
    lastScrollPosition.current = Date.now();
    
    // Calculate scroll depth
    const documentHeight = Math.max(
      document.body.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.clientHeight,
      document.documentElement.scrollHeight,
      document.documentElement.offsetHeight
    );
    
    const windowHeight = window.innerHeight;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const trackLength = documentHeight - windowHeight;
    const newScrollDepth = Math.floor((scrollTop / trackLength) * 100);
    
    // Check if we should track a new maximum scroll depth
    let shouldTrackDepth = false;
    
    // Track if crossed a 25% threshold
    if (scrollDepth.current < 25 && newScrollDepth >= 25) shouldTrackDepth = true;
    else if (scrollDepth.current < 50 && newScrollDepth >= 50) shouldTrackDepth = true;
    else if (scrollDepth.current < 75 && newScrollDepth >= 75) shouldTrackDepth = true;
    else if (scrollDepth.current < 90 && newScrollDepth >= 90) shouldTrackDepth = true;
    
    if (shouldTrackDepth) {
      scrollDepth.current = newScrollDepth;
      
      const scrollData: ScrollData = {
        client_id: getClientId(),
        session_id: getSessionId(),
        journey_id: getJourneyId(),
        page_url: window.location.href,
        scroll_depth: scrollDepth.current,
        timestamp: new Date().toISOString()
      };
      
      sendTrackingData(scrollData, 'scroll_depth');
    }
    
    // Check if we've entered a new section
    const section = getCurrentSection();
    if (section && section.id && section.id !== currentSectionId.current) {
      currentSectionId.current = section.id;
      
      const sectionData = {
        client_id: getClientId(),
        session_id: getSessionId(),
        journey_id: getJourneyId(),
        page_url: window.location.href,
        section_id: section.id,
        section_classes: section.classes,
        timestamp: new Date().toISOString()
      };
      
      sendTrackingData(sectionData, 'section_view');
    }
  };
  
  // Send data to tracking endpoint
  const sendTrackingData = async (data: any, type?: string) => {
    try {
      // Validate project ID to prevent unnecessary network requests
      if (!projectId || projectId === 'your-project-id' || 
          projectId === 'missing-project-id' || 
          projectId === 'error-getting-project-id') {
        console.warn('UTM Tracking: Invalid projectId:', projectId);
        return;
      }
      
      const trackingUrl = `https://${projectId}.supabase.co/functions/v1/utm-tracking`;
      
      // Add event type if specified
      if (type) {
        data.event_type = type;
      }
      
      // Add client info to every request
      const enhancedData = {
        ...data,
        screen_width: window.innerWidth,
        screen_height: window.innerHeight,
        user_agent: navigator.userAgent,
        referrer: document.referrer || null,
        language: navigator.language || null
      };
      
      const response = await fetch(trackingUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(enhancedData),
        credentials: 'omit'
      });
      
      if (!response.ok) {
        const responseText = await response.text();
        throw new Error(`Tracking request failed with status ${response.status}: ${responseText}`);
      }
      
    } catch (error) {
      console.warn('UTM Tracking: Failed to send data:', error);
    }
  };
  
  useEffect(() => {
    // Track the initial page view
    trackPageView();
    
    // Set up click tracking
    if (trackClicks) {
      document.addEventListener('click', handleClickEvent);
    }
    
    // Set up form tracking
    if (trackForms) {
      document.addEventListener('submit', handleFormSubmit);
    }
    
    // Set up scroll tracking
    if (trackScrolls) {
      window.addEventListener('scroll', handleScroll);
      // Initial section check
      setTimeout(handleScroll, 1000);
    }
    
    // Handle browser navigation events
    window.addEventListener('popstate', trackPageView);
    
    // Handle programmatic navigation
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = function() {
      originalPushState.apply(this, arguments);
      trackPageView();
    };
    
    history.replaceState = function() {
      originalReplaceState.apply(this, arguments);
      trackPageView();
    };
    
    // Cleanup
    return () => {
      document.removeEventListener('click', handleClickEvent);
      window.removeEventListener('popstate', trackPageView);
      
      if (trackForms) {
        document.removeEventListener('submit', handleFormSubmit);
      }
      
      if (trackScrolls) {
        window.removeEventListener('scroll', handleScroll);
      }
      
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, [trackClicks, trackForms, trackScrolls]);
  
  // This component doesn't render anything
  return null;
};

export default JourneyTracker; 