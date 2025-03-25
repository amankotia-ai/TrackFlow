'use client';

import React from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';
import WebflowTrackingScript from '@/components/analytics/WebflowTrackingScript';

function getSupabaseProjectId(): string {
  try {
    // Try to get from environment variable
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const projectIdMatch = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
    
    if (projectIdMatch && projectIdMatch[1]) {
      return projectIdMatch[1];
    }
    
    return 'missing-project-id';
  } catch (error) {
    console.error('Error getting Supabase project ID:', error);
    return 'error-getting-project-id';
  }
}

export default function WebflowTrackingPage() {
  const projectId = getSupabaseProjectId();
  
  return (
    <div className="container mx-auto py-8 space-y-6">
      <h1 className="text-3xl font-bold mb-6">Webflow Tracking Installation</h1>
      
      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertTitle>Important</AlertTitle>
        <AlertDescription>
          These instructions are specifically for Webflow websites. Add this tracking script to track user 
          journeys, clicks, and mouse movements on your Webflow site.
        </AlertDescription>
      </Alert>
      
      <WebflowTrackingScript
        projectId={projectId}
        trackClicks={true}
        trackScrolls={true}
        trackForms={true}
      />
      
      <div className="bg-muted p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">What This Script Does</h2>
        <div className="space-y-4">
          <p>The tracking script added to your Webflow site will:</p>
          <ol className="list-decimal list-inside space-y-2">
            <li>Track page views across your entire Webflow site</li>
            <li>Record complete user journeys between pages</li>
            <li>Capture click locations and elements clicked</li>
            <li>Track scroll depth and section visibility</li>
            <li>Monitor form submissions and key interactions</li>
            <li>Record UTM parameters from marketing campaigns</li>
          </ol>
          <p className="mt-4">
            All data is sent to your UTM Content Magic dashboard where you can analyze user behavior.
          </p>
        </div>
      </div>
    </div>
  );
} 