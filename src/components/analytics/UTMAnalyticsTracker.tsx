'use client';

import { useEffect, useState } from 'react';
import { JourneyTracker } from './JourneyTracker';

interface UTMAnalyticsTrackerProps {
  /**
   * Your Supabase project ID, found in the project URL
   */
  projectId: "zekigsebsmsukrummrzq";
  
  /**
   * Track mouse clicks (default: true)
   */
  trackClicks?: true;
  
  /**
   * Track mouse movements for heatmaps (default: false)
   */
  trackMouseMovement?: true;
  
  /**
   * Sample rate for mouse movements (between 0 and 1, default: 0.05)
   * Lower values reduce data volume, recommended for high-traffic sites
   */
  sampleRate?: 0.5;
}

/**
 * UTMAnalyticsTracker - A component that tracks user journeys and interactions
 * 
 * This component should be included once in your application layout or main component.
 * It will track page views, clicks, and mouse movements based on the configuration.
 * 
 * Example usage:
 * 
 * ```jsx
 * <UTMAnalyticsTracker 
 *   projectId="your-supabase-project-id"
 *   trackClicks={true}
 *   trackMouseMovement={true}
 *   sampleRate={0.05}
 * />
 * ```
 * 
 * Note: Make sure to deploy the utm-tracking Edge Function in your Supabase project
 * and create the required database tables as described in the documentation.
 */
export function UTMAnalyticsTracker({
  projectId,
  trackClicks = true,
  trackMouseMovement = false,
  sampleRate = 0.05
}: UTMAnalyticsTrackerProps) {
  const [isProjectIdValid, setIsProjectIdValid] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');

  useEffect(() => {
    // Validate project ID
    if (!projectId) {
      setValidationMessage('Project ID is missing');
      setIsProjectIdValid(false);
      return;
    }

    if (projectId === 'your-project-id' || 
        projectId === 'YOUR_ACTUAL_PROJECT_ID' || 
        projectId === 'your-supabase-project-id' ||
        projectId === 'missing-project-id' ||
        projectId === 'error-getting-project-id') {
      setValidationMessage('Please replace with your actual Supabase project ID');
      setIsProjectIdValid(false);
      return;
    }

    // Basic format validation (alphanumeric with possible hyphens, typical for Supabase project IDs)
    const validFormat = /^[a-zA-Z0-9-]+$/.test(projectId);
    if (!validFormat) {
      setValidationMessage('Project ID contains invalid characters');
      setIsProjectIdValid(false);
      return;
    }

    setIsProjectIdValid(true);
    setValidationMessage('');
  }, [projectId]);

  // If in development mode and project ID is invalid, show a small warning in the corner
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  return (
    <>
      {isDevelopment && !isProjectIdValid && (
        <div 
          style={{
            position: 'fixed',
            bottom: '10px',
            right: '10px',
            background: '#FFF3CD',
            border: '1px solid #FFECB5',
            padding: '8px 12px',
            borderRadius: '4px',
            fontSize: '12px',
            color: '#856404',
            maxWidth: '300px',
            zIndex: 9999,
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          ⚠️ UTM Analytics: {validationMessage}
        </div>
      )}

      {isProjectIdValid && (
        <JourneyTracker 
          projectId={projectId}
          trackClicks={trackClicks}
          trackMouseMovement={trackMouseMovement}
          sampleRate={sampleRate}
        />
      )}
    </>
  );
} 