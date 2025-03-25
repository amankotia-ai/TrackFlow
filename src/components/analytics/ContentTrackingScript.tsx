'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ClipboardIcon, CheckCircle2 } from 'lucide-react';

export const ContentTrackingScript: React.FC<{
  projectId: string;
  trackClicks?: boolean;
  trackMouseMovement?: boolean;
  sampleRate?: number;
}> = ({
  projectId,
  trackClicks = true,
  trackMouseMovement = false,
  sampleRate = 0.05
}) => {
  const [copied, setCopied] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'script' | 'npm'>('script');

  // Format the tracking script to be injected on the target website
  const trackingScript = `
<!-- UTM Content Magic Tracking Script -->
<script>
(function() {
  var projectId = "${projectId}";
  var trackClicks = ${trackClicks};
  var trackMouseMovement = ${trackMouseMovement};
  var sampleRate = ${sampleRate};

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

  // Track page view
  var previousPage = null;
  var pageEntryTime = Date.now();
  var sequence = 1;
  
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
    
    // Send to tracking endpoint
    sendTrackingData(data);
  }

  // Track clicks
  function handleClickEvent(e) {
    if (!trackClicks) return;
    
    var element = e.target;
    var selector = '';
    var text = null;
    
    // Generate a useful selector
    if (element.id) {
      selector = '#' + element.id;
    } else if (element.classList && element.classList.length > 0) {
      selector = '.' + Array.from(element.classList).join('.');
    } else {
      selector = element.tagName.toLowerCase();
    }
    
    // Get text content
    if (element.textContent) {
      text = element.textContent.trim().substring(0, 100);
    }
    
    var data = {
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
    
    sendTrackingData(data, 'click');
  }

  // Track mouse movements
  var mouseCoordinates = [];
  var mouseTrackingInterval = null;
  
  function startMouseTracking() {
    if (!trackMouseMovement) return;
    
    function handleMouseMovement(e) {
      // Sample mouse movements
      if (Math.random() > sampleRate) return;
      
      mouseCoordinates.push({
        x: e.pageX,
        y: e.pageY,
        t: Date.now() - pageEntryTime
      });
    }
    
    function sendMouseData() {
      if (mouseCoordinates.length === 0) return;
      
      var data = {
        client_id: getClientId(),
        session_id: getSessionId(),
        journey_id: getJourneyId(),
        page_url: window.location.href,
        coordinates: mouseCoordinates,
        timestamp: new Date().toISOString()
      };
      
      sendTrackingData(data, 'mouse_movement');
      mouseCoordinates = [];
    }
    
    document.addEventListener('mousemove', handleMouseMovement);
    mouseTrackingInterval = setInterval(sendMouseData, 5000);
  }

  // Send data to tracking endpoint
  function sendTrackingData(data, type) {
    // Validate project ID
    if (!projectId || projectId === 'your-project-id' || 
        projectId === 'YOUR_ACTUAL_PROJECT_ID' ||
        projectId === 'missing-project-id' || 
        projectId === 'error-getting-project-id') {
      console.warn('UTM Tracking: Invalid projectId. Tracking disabled.');
      return;
    }
    
    var trackingUrl = 'https://' + projectId + '.supabase.co/functions/v1/utm-tracking';
    
    // Add event type
    data.event_type = type || 'pageview';
    
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
    
    // Setup mouse movement tracking
    if (trackMouseMovement) {
      startMouseTracking();
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
  
  // Handle page visibility changes
  document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'visible' && mouseTrackingInterval === null && trackMouseMovement) {
      startMouseTracking();
    } else if (document.visibilityState === 'hidden' && mouseTrackingInterval !== null) {
      clearInterval(mouseTrackingInterval);
      mouseTrackingInterval = null;
    }
  });
})();
</script>
  `.trim();

  // Format the NPM package installation and usage instructions
  const npmPackageCode = `
// Install the package
npm install utm-content-magic-tracking

// Add to your app
import { initUTMContentTracking } from 'utm-content-magic-tracking';

// Initialize tracking in your app
initUTMContentTracking({
  projectId: "${projectId}",
  trackClicks: ${trackClicks},
  trackMouseMovement: ${trackMouseMovement},
  sampleRate: ${sampleRate}
});
  `.trim();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Website Tracking Script</CardTitle>
        <CardDescription>
          Add this script to your website to track user journeys and content replacements
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedTab} onValueChange={(value) => setSelectedTab(value as 'script' | 'npm')}>
          <TabsList className="mb-4">
            <TabsTrigger value="script">Script Tag</TabsTrigger>
            <TabsTrigger value="npm">NPM Package</TabsTrigger>
          </TabsList>

          <TabsContent value="script">
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-md">
                <p className="text-sm mb-2">
                  Add this script to the <code>&lt;head&gt;</code> section of your website to enable tracking.
                </p>
              </div>

              <div className="relative">
                <pre className="p-4 rounded-md bg-slate-950 text-slate-50 overflow-auto text-xs max-h-96">
                  {trackingScript}
                </pre>
                <Button 
                  size="sm" 
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(trackingScript)}
                >
                  {copied ? <CheckCircle2 className="h-4 w-4" /> : <ClipboardIcon className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="npm">
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-md">
                <p className="text-sm mb-2">
                  For modern JavaScript applications, you can use our NPM package.
                </p>
              </div>

              <div className="relative">
                <pre className="p-4 rounded-md bg-slate-950 text-slate-50 overflow-auto text-xs max-h-96">
                  {npmPackageCode}
                </pre>
                <Button 
                  size="sm" 
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(npmPackageCode)}
                >
                  {copied ? <CheckCircle2 className="h-4 w-4" /> : <ClipboardIcon className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-6 space-y-4">
          <h3 className="text-lg font-medium">Customization Options</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="projectId">Project ID</Label>
              <Input 
                id="projectId" 
                value={projectId} 
                disabled 
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">Your Supabase project ID</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sampleRate">Sample Rate</Label>
              <div className="flex gap-2 items-center">
                <Input 
                  id="sampleRate" 
                  type="number" 
                  value={sampleRate} 
                  disabled
                  min="0"
                  max="1"
                  step="0.01"
                />
                <span className="text-muted-foreground">({Math.round(sampleRate * 100)}%)</span>
              </div>
              <p className="text-xs text-muted-foreground">Rate for sampling mouse movements (0-1)</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ContentTrackingScript; 