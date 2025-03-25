'use client';

import React, { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [showBanner, setShowBanner] = useState(true);
  const [hasTrackingData, setHasTrackingData] = useState<boolean | null>(null);

  // Check if there's any tracking data in localStorage
  useEffect(() => {
    const hasCheckedTrackingScript = localStorage.getItem('utm_tracking_script_dismissed');
    if (hasCheckedTrackingScript === 'true') {
      setShowBanner(false);
    }

    // Here you could also check if there's actual tracking data in the database
    // For now, we'll just show the banner always unless dismissed
  }, []);

  const dismissBanner = () => {
    localStorage.setItem('utm_tracking_script_dismissed', 'true');
    setShowBanner(false);
  };

  return (
    <div className="container mx-auto py-6">
      {showBanner && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-md p-4 relative">
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute right-2 top-2" 
            onClick={dismissBanner}
          >
            <X className="h-4 w-4" />
          </Button>

          <div className="flex items-start gap-4">
            <Bell className="h-5 w-5 text-amber-500 mt-0.5" />
            <div>
              <h3 className="font-medium text-amber-800">Important: Install tracking on your website</h3>
              <div className="text-sm text-muted-foreground mb-8">
                <p className="mb-2">
                  Track UTM parameters and user journeys through your website.
                  To see user journeys and visualize user interactions, you need to add our tracking script to your website.
                </p>
              </div>
              <div className="mt-3">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="bg-white hover:bg-amber-100"
                  onClick={() => window.open('/analytics/tracking-script', '_blank')}
                >
                  Get Tracking Script
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {children}
    </div>
  );
} 