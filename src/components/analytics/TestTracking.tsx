import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

const TestTracking: React.FC = () => {
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      // Generate test tracking data
      const clientId = `test_${Math.random().toString(36).substring(2, 15)}`;
      const timestamp = new Date().toISOString();
      
      const trackingData = {
        utm_source: "test",
        utm_medium: "test",
        utm_campaign: "test",
        utm_term: "test",
        utm_content: "test",
        page_url: window.location.href,
        referrer: document.referrer,
        client_id: clientId,
        timestamp,
      };

      // Use the project ID from the configuration
      const projectId = "zekigsebsmsukrummrzq";
      
      // Send the test tracking data to the tracking function
      const trackingUrl = `https://${projectId}.supabase.co/functions/v1/utm-tracking`;
      
      // Use fetch for testing
      const response = await fetch(trackingUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(trackingData),
        credentials: "omit",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Server returned ${response.status}: ${errorData.error || response.statusText}`);
      }

      const responseData = await response.json();

      // Since we can't easily verify if the data was inserted due to technical limitations
      // We'll just assume success if the tracking function returns a success response
      setTestResult({
        success: true,
        message: "UTM tracking function responded successfully. To verify the data is being properly stored, check your database directly in the Supabase dashboard.",
      });
    } catch (error) {
      console.error("Error testing UTM tracking function:", error);
      setTestResult({
        success: false,
        message: `Error: ${(error as Error).message || "Unknown error occurred"}`,
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Test UTM Tracking</CardTitle>
        <CardDescription>
          Test if the UTM tracking function is working correctly
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          This will send a test record to your UTM tracking function to ensure it's properly receiving data.
        </p>
        {testResult && (
          <div className={`p-4 mb-4 rounded-md ${testResult.success ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
            <div className="flex items-start">
              {testResult.success ? (
                <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
              )}
              <div>
                <p className="font-medium">{testResult.success ? "Success" : "Error"}</p>
                <p className="text-sm">{testResult.message}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handleTest} disabled={isTesting}>
          {isTesting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Testing...
            </>
          ) : (
            "Test UTM Tracking"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default TestTracking; 