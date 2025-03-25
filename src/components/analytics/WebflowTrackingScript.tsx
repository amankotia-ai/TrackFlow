'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ClipboardIcon, CheckCircle2, ExternalLink } from 'lucide-react';

export const WebflowTrackingScript: React.FC<{
  projectId: string;
  trackClicks?: boolean;
  trackScrolls?: boolean;
  trackForms?: boolean;
}> = ({
  projectId,
  trackClicks = true,
  trackScrolls = true,
  trackForms = true
}) => {
  const [copied, setCopied] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'head' | 'body'>('head');

  // Script for Webflow head section
  const webflowHeadScript = `
<!-- UTM Content Magic Tracking Script - HEAD -->
<script>
  window.utmCmConfig = {
    projectId: "${projectId}",
    trackClicks: ${trackClicks},
    trackScrolls: ${trackScrolls},
    trackForms: ${trackForms}
  };
</script>
`.trim();

  // Script for Webflow body section
  const webflowBodyScript = `
<!-- UTM Content Magic Tracking Script - BODY -->
<script>
(function() {
  // Get config from head
  var config = window.utmCmConfig || {};
  var projectId = config.projectId;
  var trackClicks = config.trackClicks !== false;
  var trackScrolls = config.trackScrolls !== false;
  var trackForms = config.trackForms !== false;

  // Store client and session IDs
  function getClientId() {
    var clientId = localStorage.getItem('utm_cm_client_id');
    if (!clientId) {
      clientId = ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c => 
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
      );
      localStorage.setItem('utm_cm_client_id', clientId);
    }
    return clientId;
  }

  function getSessionId() {
    var sessionId = sessionStorage.getItem('utm_cm_session_id');
    if (!sessionId) {
      sessionId = ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c => 
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
      );
      sessionStorage.setItem('utm_cm_session_id', sessionId);
    }
    return sessionId;
  }

  function getJourneyId() {
    var journeyId = sessionStorage.getItem('utm_cm_journey_id');
    if (!journeyId) {
      journeyId = ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c => 
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
      );
      sessionStorage.setItem('utm_cm_journey_id', journeyId);
    }
    return journeyId;
  }

  // Get UTM parameters
  function getUtmParams() {
    var urlParams = new URLSearchParams(window.location.search);
    return {
      utm_source: urlParams.get('utm_source'),
      utm_medium: urlParams.get('utm_medium'),
      utm_campaign: urlParams.get('utm_campaign'),
      utm_term: urlParams.get('utm_term'),
      utm_content: urlParams.get('utm_content')
    };
  }

  // Get the current visible section
  function getCurrentSection() {
    var sections = document.querySelectorAll('section, [data-section], [id]');
    if (!sections.length) return null;
    
    var visibleSections = [];
    
    for (var i = 0; i < sections.length; i++) {
      var section = sections[i];
      var rect = section.getBoundingClientRect();
      
      // Check if the section is in the viewport
      if (rect.top < window.innerHeight && rect.bottom >= 0) {
        var visibility = 0;
        
        // Calculate how much of the section is visible
        var visibleTop = Math.max(0, rect.top);
        var visibleBottom = Math.min(window.innerHeight, rect.bottom);
        
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
      return visibleSections.sort(function(a, b) {
        return b.visibility - a.visibility;
      })[0];
    }
    
    return null;
  }

  // Track page view
  var previousPage = null;
  var pageEntryTime = Date.now();
  var sequence = 1;
  var lastScrollPosition = 0;
  var scrollDepth = 0;
  var currentSectionId = null;
  
  function trackPageView() {
    var currentTime = Date.now();
    var timeOnPreviousPage = previousPage ? currentTime - pageEntryTime : null;
    
    var data = {
      client_id: getClientId(),
      session_id: getSessionId(),
      journey_id: getJourneyId(),
      page_url: window.location.href,
      page_title: document.title,
      previous_page_url: previousPage,
      page_sequence: sequence,
      time_on_previous_page: timeOnPreviousPage,
      event_type: 'pageview',
      timestamp: new Date().toISOString(),
      ...getUtmParams()
    };
    
    // Reset for next page
    pageEntryTime = currentTime;
    previousPage = window.location.href;
    sequence += 1;
    
    // Reset scroll tracking
    lastScrollPosition = 0;
    scrollDepth = 0;
    currentSectionId = null;
    
    // Send to tracking endpoint
    sendTrackingData(data);
  }

  // Track clicks
  function handleClickEvent(e) {
    if (!trackClicks) return;
    
    var element = e.target;
    var clickTarget = null;
    
    // Try to find the most relevant clickable parent
    while (element && element !== document.body) {
      if (element.tagName === 'A' || 
          element.tagName === 'BUTTON' || 
          element.getAttribute('role') === 'button' ||
          element.hasAttribute('data-track-click') ||
          element.classList.contains('btn') ||
          element.classList.contains('button')) {
        clickTarget = element;
        break;
      }
      element = element.parentElement;
    }
    
    if (!clickTarget) clickTarget = e.target;
    
    var selector = '';
    var text = null;
    var section = null;
    
    // Generate a useful selector
    if (clickTarget.id) {
      selector = '#' + clickTarget.id;
    } else if (clickTarget.classList && clickTarget.classList.length > 0) {
      selector = '.' + Array.from(clickTarget.classList).join('.');
    } else {
      selector = clickTarget.tagName.toLowerCase();
    }
    
    // Get text content
    if (clickTarget.textContent) {
      text = clickTarget.textContent.trim().substring(0, 100);
    }
    
    // Find the section this element is in
    var currentElement = clickTarget;
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
      currentElement = currentElement.parentElement;
    }
    
    var href = clickTarget.tagName === 'A' ? clickTarget.getAttribute('href') : null;
    
    var data = {
      client_id: getClientId(),
      session_id: getSessionId(),
      journey_id: getJourneyId(),
      page_url: window.location.href,
      x: e.pageX,
      y: e.pageY,
      element_selector: selector,
      element_text: text,
      element_href: href,
      element_section: section,
      element_tag: clickTarget.tagName.toLowerCase(),
      element_classes: clickTarget.className || null,
      timestamp: new Date().toISOString(),
      event_type: 'click'
    };
    
    sendTrackingData(data);
  }

  // Track form submissions
  function handleFormSubmit(e) {
    if (!trackForms) return;
    
    var form = e.target;
    var formId = form.id || null;
    var formAction = form.getAttribute('action') || null;
    var formClasses = form.className || null;
    
    // Get form fields (without values for privacy)
    var fields = [];
    var formElements = form.elements;
    
    for (var i = 0; i < formElements.length; i++) {
      var field = formElements[i];
      if (field.name) {
        fields.push({
          name: field.name,
          type: field.type || field.tagName.toLowerCase()
        });
      }
    }
    
    var data = {
      client_id: getClientId(),
      session_id: getSessionId(),
      journey_id: getJourneyId(),
      page_url: window.location.href,
      form_id: formId,
      form_action: formAction,
      form_classes: formClasses,
      form_fields: fields,
      timestamp: new Date().toISOString(),
      event_type: 'form_submit'
    };
    
    sendTrackingData(data);
  }

  // Track scrolling and visible sections
  function handleScroll() {
    if (!trackScrolls) return;
    
    // Don't track every scroll event, throttle it
    if (Date.now() - lastScrollPosition < 1000) return;
    lastScrollPosition = Date.now();
    
    // Calculate scroll depth
    var documentHeight = Math.max(
      document.body.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.clientHeight,
      document.documentElement.scrollHeight,
      document.documentElement.offsetHeight
    );
    
    var windowHeight = window.innerHeight;
    var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    var trackLength = documentHeight - windowHeight;
    var newScrollDepth = Math.floor((scrollTop / trackLength) * 100);
    
    // Check if we should track a new maximum scroll depth
    var shouldTrackDepth = false;
    
    // Track if crossed a 25% threshold
    if (scrollDepth < 25 && newScrollDepth >= 25) shouldTrackDepth = true;
    else if (scrollDepth < 50 && newScrollDepth >= 50) shouldTrackDepth = true;
    else if (scrollDepth < 75 && newScrollDepth >= 75) shouldTrackDepth = true;
    else if (scrollDepth < 90 && newScrollDepth >= 90) shouldTrackDepth = true;
    
    if (shouldTrackDepth) {
      scrollDepth = newScrollDepth;
      
      var data = {
        client_id: getClientId(),
        session_id: getSessionId(),
        journey_id: getJourneyId(),
        page_url: window.location.href,
        scroll_depth: scrollDepth,
        timestamp: new Date().toISOString(),
        event_type: 'scroll_depth'
      };
      
      sendTrackingData(data);
    }
    
    // Check if we've entered a new section
    var section = getCurrentSection();
    if (section && section.id && section.id !== currentSectionId) {
      currentSectionId = section.id;
      
      var sectionData = {
        client_id: getClientId(),
        session_id: getSessionId(),
        journey_id: getJourneyId(),
        page_url: window.location.href,
        section_id: section.id,
        section_classes: section.classes,
        timestamp: new Date().toISOString(),
        event_type: 'section_view'
      };
      
      sendTrackingData(sectionData);
    }
  }

  // Send data to tracking endpoint
  function sendTrackingData(data, type) {
    // Add event type if provided
    if (type) data.event_type = type;
    
    // Validate project ID
    if (!projectId || projectId === 'your-project-id' || 
        projectId === 'YOUR_ACTUAL_PROJECT_ID' ||
        projectId === 'missing-project-id' || 
        projectId === 'error-getting-project-id') {
      console.warn('UTM Tracking: Invalid projectId. Tracking disabled.');
      return;
    }
    
    var trackingUrl = 'https://' + projectId + '.supabase.co/functions/v1/utm-tracking';
    
    // Add client info to every request
    data = {
      ...data,
      screen_width: window.innerWidth,
      screen_height: window.innerHeight,
      user_agent: navigator.userAgent,
      referrer: document.referrer || null,
      language: navigator.language || null
    };
    
    // Send the request
    fetch(trackingUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data),
      credentials: 'omit'
    }).catch(function(error) {
      console.warn('UTM Tracking: Failed to send data', error);
    });
  }

  // Initialize tracking
  function initTracking() {
    // Track initial page view
    trackPageView();
    
    // Setup click tracking
    if (trackClicks) {
      document.addEventListener('click', handleClickEvent);
    }
    
    // Setup form tracking
    if (trackForms) {
      document.addEventListener('submit', handleFormSubmit);
    }
    
    // Setup scroll tracking
    if (trackScrolls) {
      window.addEventListener('scroll', handleScroll);
      // Initial section check
      setTimeout(handleScroll, 1000);
    }
    
    // Handle navigation with History API
    var originalPushState = history.pushState;
    var originalReplaceState = history.replaceState;
    
    history.pushState = function() {
      originalPushState.apply(this, arguments);
      setTimeout(trackPageView, 0);
    };
    
    history.replaceState = function() {
      originalReplaceState.apply(this, arguments);
      setTimeout(trackPageView, 0);
    };
    
    window.addEventListener('popstate', function() {
      setTimeout(trackPageView, 0);
    });
  }
  
  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTracking);
  } else {
    initTracking();
  }
})();
</script>
`.trim();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Webflow Tracking Script</CardTitle>
        <CardDescription>
          Add these scripts to your Webflow site to track user journeys and interactions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="mb-4">
            <p className="text-sm text-muted-foreground mb-4">
              Webflow requires adding scripts in two places - one in the HEAD and one before the end of the BODY.
              Follow the instructions below to add both scripts to your Webflow site.
            </p>
          </div>
          
          <Tabs value={selectedTab} onValueChange={(value) => setSelectedTab(value as 'head' | 'body')}>
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
          
          <div className="border rounded-md p-4">
            <h3 className="font-medium mb-2">What This Script Tracks</h3>
            <p className="text-sm mb-3">
              This tracking script captures detailed user journey information:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li><span className="font-medium">Page Views</span> - Records when users navigate to different pages</li>
              <li><span className="font-medium">Section Views</span> - Detects when users scroll to different sections of your page</li>
              <li><span className="font-medium">Button & Link Clicks</span> - Tracks when users click on buttons, links, and interactive elements</li>
              <li><span className="font-medium">Form Submissions</span> - Records when users submit forms (without capturing sensitive data)</li>
              <li><span className="font-medium">Scroll Depth</span> - Measures how far users scroll down your pages</li>
            </ul>
          </div>
          
          <div className="border rounded-md p-4">
            <h3 className="font-medium mb-2">Customization Options</h3>
            <p className="text-sm mb-3">
              You can modify the tracking configuration in the Head Code by changing these values:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li><code>trackClicks: true</code> - Set to <code>false</code> to disable click tracking</li>
              <li><code>trackScrolls: true</code> - Set to <code>false</code> to disable scroll and section tracking</li>
              <li><code>trackForms: true</code> - Set to <code>false</code> to disable form submission tracking</li>
            </ul>
          </div>
          
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
                <ul className="list-disc list-inside ml-6 mt-1 text-muted-foreground">
                  <li>Copy the HEAD script from the tab above</li>
                  <li>Paste it into the Head Code field</li>
                </ul>
              </li>
              <li className="pb-2">
                <span className="font-medium">Add the BODY script to the "Footer Code" section</span>
                <ul className="list-disc list-inside ml-6 mt-1 text-muted-foreground">
                  <li>Copy the BODY script from the tab above</li>
                  <li>Paste it into the Footer Code field</li>
                </ul>
              </li>
              <li>
                <span className="font-medium">Save and publish your site</span>
              </li>
            </ol>
            
            <div className="mt-4 flex justify-center">
              <a 
                href="https://university.webflow.com/lesson/custom-code-in-the-head-and-body-tags" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
              >
                <span>Webflow Custom Code Guide</span>
                <ExternalLink className="ml-1 h-3 w-3" />
              </a>
            </div>
          </div>
          
          <div className="bg-gray-100 rounded-md p-4 border border-gray-200">
            <h3 className="font-medium mb-3">Webflow Integration Preview</h3>
            <div className="bg-white border border-gray-300 rounded-md overflow-hidden shadow-sm">
              <div className="bg-gray-800 text-white p-2 text-xs flex items-center">
                <div className="mr-auto">Project Settings → Custom Code</div>
                <div className="flex space-x-1">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
              </div>
              <div className="p-4">
                <div className="flex border-b border-gray-200 mb-4">
                  <div className="px-3 py-2 font-medium text-sm border-b-2 border-blue-500 text-blue-600">Head Code</div>
                  <div className="px-3 py-2 text-sm text-gray-500">Footer Code</div>
                </div>
                <div className="bg-gray-50 p-3 rounded border border-gray-300 text-xs font-mono mb-6">
                  <span className="text-gray-500">&lt;!-- UTM Content Magic Tracking Script - HEAD --&gt;</span><br/>
                  <span className="text-purple-600">&lt;script&gt;</span><br/>
                  <span className="ml-2">window.utmCmConfig = {'{'}</span><br/>
                  <span className="ml-4">projectId: <span className="text-green-600">"{projectId}"</span>,</span><br/>
                  <span className="ml-4">trackClicks: <span className="text-blue-600">true</span>,</span><br/>
                  <span className="ml-4">trackScrolls: <span className="text-blue-600">true</span>,</span><br/>
                  <span className="ml-4">trackForms: <span className="text-blue-600">true</span></span><br/>
                  <span className="ml-2">{'}'};</span><br/>
                  <span className="text-purple-600">&lt;/script&gt;</span>
                </div>
                <div className="flex justify-end">
                  <div className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded">Save Changes</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WebflowTrackingScript; 