import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

const TestContentRuleTracking: React.FC = () => {
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    rules?: any[];
  } | null>(null);

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      // Generate test UTM parameters for content rule testing
      const testParams = {
        utm_source: "test_source",
        utm_medium: "test_medium",
        utm_campaign: "test_campaign",
        utm_term: "test_term",
        utm_content: "test_content"
      };
      
      // Use the project ID from the configuration
      const projectId = "zekigsebsmsukrummrzq";
      
      // Build the URL with query parameters
      const queryParams = new URLSearchParams(testParams);
      const contentRuleUrl = `https://${projectId}.supabase.co/functions/v1/utm-content?${queryParams.toString()}`;
      
      // Fetch content rules that match these parameters
      const response = await fetch(contentRuleUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Server returned ${response.status}: ${errorData.error || response.statusText}`);
      }

      const responseData = await response.json();
      
      setTestResult({
        success: true,
        message: responseData.rules && responseData.rules.length > 0 
          ? `Found ${responseData.rules.length} matching content rules.` 
          : "No matching content rules found. This may be expected if you haven't created any rules that match the test parameters.",
        rules: responseData.rules || []
      });
    } catch (error) {
      console.error("Error testing content rule function:", error);
      setTestResult({
        success: false,
        message: `Error: ${(error as Error).message || "Unknown error occurred"}`
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Test Content Rule Tracking</CardTitle>
        <CardDescription>
          Test if the UTM content rule function is working correctly
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          This will send a test request to your UTM content rule function to check if it's properly retrieving matching rules.
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
                
                {testResult.rules && testResult.rules.length > 0 && (
                  <div className="mt-2">
                    <p className="font-medium text-sm">Matching Rules:</p>
                    <ul className="text-xs list-disc list-inside mt-1">
                      {testResult.rules.map((rule, idx) => (
                        <li key={idx}>
                          {rule.name || "Unnamed Rule"}: {rule.condition_type} = {rule.condition_value} 
                          {rule.action_type && ` → ${rule.action_type}`}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
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
            "Test Content Rules"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default TestContentRuleTracking; 