'use client';

import React from 'react';
import ContentTrackingScript from '@/components/analytics/ContentTrackingScript';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';

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

export default function TrackingScriptPage() {
  const projectId = getSupabaseProjectId();
  
  return (
    <div className="container mx-auto py-8 space-y-6">
      <h1 className="text-3xl font-bold mb-6">Website Tracking Script</h1>
      
      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertTitle>Important</AlertTitle>
        <AlertDescription>
          Add this script to the website where you want to track user journeys and content replacements.
          This is different from the UTM Content Magic admin panel - this script should be added to your target website.
          <div className="mt-2">
            <span className="font-medium">Using Webflow?</span> See our <a href="/utm-content-magic/analytics/webflow-script" className="text-primary hover:underline">Webflow-specific installation guide</a>.
          </div>
        </AlertDescription>
      </Alert>
      
      <ContentTrackingScript 
        projectId={projectId}
        trackClicks={true}
        trackMouseMovement={false}
        sampleRate={0.05}
      />
      
      <div className="bg-muted p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">How This Works</h2>
        <div className="space-y-4">
          <p>
            The tracking script will:
          </p>
          <ul className="list-disc pl-5 space-y-3 mb-4">
            <li>Track page views with UTM parameters</li>
            <li>Monitor user journeys across pages</li>
            <li>Track clicks on buttons and links</li>
            <li>Track scroll depth and section visibility</li>
            <li>Monitor form submissions and key interactions</li>
          </ul>
          <p className="mt-4">
            All data is sent to your Supabase project and can be viewed in the UTM Content Magic analytics dashboard.
          </p>
        </div>
      </div>
    </div>
  );
} 