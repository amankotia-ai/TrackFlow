'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function TestTracking() {
  const [projectId, setProjectId] = useState('');
  const [journeyEvent, setJourneyEvent] = useState(JSON.stringify({
    journey_id: "test-journey-123",
    event_type: "page_view",
    page_url: "/test-page",
    page_title: "Test Page",
    previous_page: "/previous-page",
    time_on_previous_page: 30,
    referrer: "https://example.com/referrer",
    timestamp: new Date().toISOString(),
    utm_source: "test-source",
    utm_medium: "test-medium",
    utm_campaign: "test-campaign",
    user_agent: navigator.userAgent
  }, null, 2));

  const [clickEvent, setClickEvent] = useState(JSON.stringify({
    journey_id: "test-journey-123",
    event_type: "click",
    page_url: "/test-page",
    x_position: 500,
    y_position: 300,
    element_type: "button",
    element_id: "test-button",
    element_class: "primary-button",
    element_text: "Click Me",
    timestamp: new Date().toISOString()
  }, null, 2));

  const [mouseEvent, setMouseEvent] = useState(JSON.stringify({
    journey_id: "test-journey-123",
    event_type: "mouse_movement",
    page_url: "/test-page",
    coordinates: [
      { x: 100, y: 100, t: 0 },
      { x: 200, y: 150, t: 100 },
      { x: 300, y: 200, t: 200 },
      { x: 400, y: 250, t: 300 }
    ],
    timestamp: new Date().toISOString()
  }, null, 2));

  const sendTestEvent = async (eventData: string) => {
    if (!projectId) {
      toast.error("Please enter your Supabase project ID");
      return;
    }

    try {
      const parsedData = JSON.parse(eventData);
      const trackingUrl = `https://${projectId}.supabase.co/functions/v1/utm-tracking`;
      
      toast.info(`Sending request to ${trackingUrl}`);
      
      const response = await fetch(trackingUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(parsedData),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Event sent successfully: ${JSON.stringify(data)}`);
      } else {
        const errorText = await response.text();
        toast.error(`Error: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      toast.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">UTM Tracking Test Tool</h1>
      <p className="mb-6 text-gray-600">
        Use this tool to test the UTM tracking edge function with sample data.
      </p>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Edge Function Configuration</CardTitle>
          <CardDescription>Enter your Supabase project ID to test the tracking function</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Label htmlFor="projectId" className="min-w-32">Supabase Project ID:</Label>
            <Input 
              id="projectId"
              value={projectId} 
              onChange={(e) => setProjectId(e.target.value)} 
              placeholder="Your Supabase project ID"
              className="flex-1"
            />
          </div>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-gray-500">
            Find your project ID in the Supabase dashboard URL: https://app.supabase.com/project/YOUR-PROJECT-ID
          </p>
        </CardFooter>
      </Card>

      <Tabs defaultValue="journey">
        <TabsList className="mb-4">
          <TabsTrigger value="journey">Journey Event</TabsTrigger>
          <TabsTrigger value="click">Click Event</TabsTrigger>
          <TabsTrigger value="mouse">Mouse Movement</TabsTrigger>
        </TabsList>
        
        <TabsContent value="journey">
          <Card>
            <CardHeader>
              <CardTitle>Test Journey Event</CardTitle>
              <CardDescription>Send a test page view event to the journey_tracking table</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={journeyEvent}
                onChange={(e) => setJourneyEvent(e.target.value)}
                className="font-mono text-sm"
                rows={15}
              />
            </CardContent>
            <CardFooter>
              <Button onClick={() => sendTestEvent(journeyEvent)}>Send Journey Event</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="click">
          <Card>
            <CardHeader>
              <CardTitle>Test Click Event</CardTitle>
              <CardDescription>Send a test click event to the click_tracking table</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={clickEvent}
                onChange={(e) => setClickEvent(e.target.value)}
                className="font-mono text-sm"
                rows={15}
              />
            </CardContent>
            <CardFooter>
              <Button onClick={() => sendTestEvent(clickEvent)}>Send Click Event</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="mouse">
          <Card>
            <CardHeader>
              <CardTitle>Test Mouse Movement</CardTitle>
              <CardDescription>Send a test mouse movement event to the mouse_tracking table</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={mouseEvent}
                onChange={(e) => setMouseEvent(e.target.value)}
                className="font-mono text-sm"
                rows={15}
              />
            </CardContent>
            <CardFooter>
              <Button onClick={() => sendTestEvent(mouseEvent)}>Send Mouse Event</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      <ToastContainer position="bottom-right" />
    </div>
  );
} 