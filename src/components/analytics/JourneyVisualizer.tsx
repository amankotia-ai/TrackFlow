import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ExternalLink, FileDown, Clock, ArrowRightCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { JourneySkeleton } from "@/components/ui/skeletons";

// Journey data type
interface JourneyData {
  journey_id: string;
  client_id: string;
  start_time: string;
  end_time: string;
  duration_seconds: number;
  page_count: number;
  pages: {
    page_url: string;
    page_title: string;
    page_sequence: number;
    timestamp: string;
    time_on_page: number | null;
  }[];
}

// Function to format time in seconds to readable format
const formatDuration = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds} sec`;
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes < 60) {
    return `${minutes} min ${remainingSeconds} sec`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  return `${hours} hr ${remainingMinutes} min`;
};

// Format date-time
const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString();
};

// Shorten URL
const shortenUrl = (url: string): string => {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.pathname + parsedUrl.search;
  } catch (e) {
    return url;
  }
};

const JourneyVisualizer: React.FC = () => {
  const [activeTab, setActiveTab] = useState("journeys");
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    to: new Date(),
  });
  const [selectedJourney, setSelectedJourney] = useState<JourneyData | null>(null);
  
  // Fetch journeys
  const { data: journeysData, isLoading, error: journeysError } = useQuery({
    queryKey: ["journeys", dateRange.from.toISOString(), dateRange.to.toISOString()],
    queryFn: async () => {
      try {
        console.log("Fetching journey data with date range:", {
          from: dateRange.from.toISOString(),
          to: dateRange.to.toISOString()
        });
        
        // Try first with the get_user_journeys function
        const { data: functionData, error: functionError } = await supabase.rpc("get_user_journeys", {
          p_from_date: dateRange.from.toISOString(),
          p_to_date: dateRange.to.toISOString(),
          p_limit: 100
        });
        
        // If the RPC function succeeds, return the data
        if (!functionError && functionData) {
          console.log("Successfully retrieved journey data via RPC function:", functionData.length);
          return functionData as JourneyData[];
        }
        
        // If there's a function error but it's not just because the function doesn't exist,
        // log it but continue to try the fallback method
        if (functionError && !functionError.message.includes("function \"get_user_journeys\" does not exist")) {
          console.error("Error from get_user_journeys function:", functionError);
        }
        
        console.log("Falling back to manual journey data calculation...");
        
        // If the function fails or doesn't exist, construct the journey data manually
        const { data: journeyRecords, error: journeyError } = await supabase
          .from("journey_tracking")
          .select("*")
          .gte("timestamp", dateRange.from.toISOString())
          .lte("timestamp", dateRange.to.toISOString())
          .order("timestamp", { ascending: true });
          
        if (journeyError) throw journeyError;
        
        if (!journeyRecords || journeyRecords.length === 0) {
          console.log("No journey records found");
          return [];
        }
        
        console.log(`Found ${journeyRecords.length} journey records, processing...`);
        
        // Group records by journey_id
        const journeyGroups = journeyRecords.reduce((groups, record) => {
          const journeyId = record.journey_id;
          if (!groups[journeyId]) {
            groups[journeyId] = [];
          }
          groups[journeyId].push(record);
          return groups;
        }, {} as Record<string, any[]>);
        
        // Convert grouped records to journey objects
        const journeys = Object.entries(journeyGroups).map(([journeyId, records]) => {
          records.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
          
          const startTime = records[0].timestamp;
          const endTime = records[records.length - 1].timestamp;
          const durationMs = new Date(endTime).getTime() - new Date(startTime).getTime();
          const durationSeconds = Math.floor(durationMs / 1000);
          
          return {
            journey_id: journeyId,
            client_id: records[0].client_id,
            start_time: startTime,
            end_time: endTime,
            duration_seconds: durationSeconds,
            page_count: records.length,
            pages: records.map(record => ({
              page_url: record.page_url,
              page_title: record.page_title || "",
              page_sequence: record.page_sequence,
              timestamp: record.timestamp,
              time_on_page: record.time_on_previous_page
            }))
          } as JourneyData;
        });
        
        console.log(`Successfully processed ${journeys.length} journeys`);
        return journeys;
      } catch (error) {
        console.error("Error fetching journey data:", error);
        throw error;
      }
    },
  });
  
  const showSetupInstructions = journeysError && journeysError.toString().includes("function \"get_user_journeys\" does not exist");
  
  // Handle selecting a journey to view in detail
  const handleSelectJourney = (journey: JourneyData) => {
    setSelectedJourney(journey);
    setActiveTab("journey-detail");
  };
  
  // Export journey data as CSV
  const exportJourneyDataCsv = () => {
    if (!journeysData || journeysData.length === 0) return;
    
    const headers = [
      "journey_id",
      "client_id",
      "start_time", 
      "end_time",
      "duration_seconds",
      "page_count"
    ];
    
    const csvRows = [
      headers.join(","),
      ...journeysData.map(journey => 
        [
          journey.journey_id,
          journey.client_id,
          journey.start_time,
          journey.end_time,
          journey.duration_seconds,
          journey.page_count
        ].join(",")
      )
    ];
    
    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `journeys_${new Date().toISOString()}.csv`);
    link.click();
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>User Journey Analysis</CardTitle>
        <CardDescription>
          Track and visualize user journeys through your website
        </CardDescription>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pt-4">
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
          />
          <Button variant="outline" onClick={exportJourneyDataCsv}>
            <FileDown className="mr-2 h-4 w-4" />
            Export Data
          </Button>
        </div>
      </CardHeader>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="px-6">
          <TabsList className="mb-4">
            <TabsTrigger value="journeys">All Journeys</TabsTrigger>
            <TabsTrigger value="journey-detail" disabled={!selectedJourney}>
              Journey Details
            </TabsTrigger>
          </TabsList>
        </div>
        
        <CardContent>
          <TabsContent value="journeys">
            {isLoading ? (
              <div>
                <JourneySkeleton />
              </div>
            ) : showSetupInstructions ? (
              <div className="border rounded-md p-6 space-y-4">
                <h3 className="text-lg font-medium">Setup Required</h3>
                <p>The journey tracking script needs to be added to your target website.</p>
                
                <div className="bg-muted p-4 rounded-md text-sm">
                  <p className="font-medium mb-2">To enable user journey tracking:</p>
                  <ol className="list-decimal list-inside space-y-2">
                    <li>Go to <a href="/utm-content-magic/analytics/tracking-script" className="text-primary hover:underline" target="_blank">Get Tracking Script</a></li>
                    <li>Add the provided script to your target website</li>
                    <li>This will track user journeys on your website, not on this admin panel</li>
                    <li>Data will appear here after users visit your website</li>
                  </ol>
                </div>
                
                <p className="text-sm text-muted-foreground">
                  Remember: User journey data is collected from your target website, not from the UTM Content Magic admin panel.
                </p>
              </div>
            ) : journeysData && journeysData.length > 0 ? (
              <Table>
                <TableCaption>User journeys for the selected date range</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Start Time</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Pages</TableHead>
                    <TableHead>First Page</TableHead>
                    <TableHead>Last Page</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {journeysData.map((journey) => (
                    <TableRow key={journey.journey_id}>
                      <TableCell>{formatDateTime(journey.start_time)}</TableCell>
                      <TableCell>{formatDuration(journey.duration_seconds)}</TableCell>
                      <TableCell>{journey.page_count}</TableCell>
                      <TableCell title={journey.pages[0]?.page_url}>
                        {journey.pages[0]?.page_title || shortenUrl(journey.pages[0]?.page_url || "")}
                      </TableCell>
                      <TableCell title={journey.pages[journey.pages.length - 1]?.page_url}>
                        {journey.pages[journey.pages.length - 1]?.page_title || 
                          shortenUrl(journey.pages[journey.pages.length - 1]?.page_url || "")}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSelectJourney(journey)}
                        >
                          Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-10">
                <p className="text-muted-foreground">No journey data found for the selected period.</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="journey-detail">
            {selectedJourney && (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h3 className="text-lg font-medium">Journey Details</h3>
                    <p className="text-sm text-muted-foreground">
                      Started {formatDateTime(selectedJourney.start_time)} · 
                      Duration {formatDuration(selectedJourney.duration_seconds)}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setActiveTab("journeys")}>
                    Back to All Journeys
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {selectedJourney.pages.map((page, index) => (
                    <div key={index} className="flex flex-col">
                      <div className="flex items-start">
                        <div className="mr-4 flex flex-col items-center">
                          <div className="flex items-center justify-center rounded-full bg-primary w-8 h-8 text-primary-foreground">
                            {index + 1}
                          </div>
                          {index < selectedJourney.pages.length - 1 && (
                            <div className="h-14 w-0.5 bg-muted" />
                          )}
                        </div>
                        <div className="pt-1 pb-8 space-y-1">
                          <div className="flex items-center">
                            <h4 className="font-medium">{page.page_title || shortenUrl(page.page_url)}</h4>
                            <a 
                              href={page.page_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="ml-2 opacity-70 hover:opacity-100"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {formatDateTime(page.timestamp)}
                          </p>
                          {page.time_on_page && (
                            <div className="flex items-center mt-2 text-sm text-muted-foreground">
                              <Clock className="h-4 w-4 mr-1" />
                              Time on page: {formatDuration(Math.floor(page.time_on_page / 1000))}
                            </div>
                          )}
                          {index < selectedJourney.pages.length - 1 && (
                            <div className="flex items-center mt-2 text-sm">
                              <ArrowRightCircle className="h-4 w-4 mr-1 text-primary" />
                              Navigated to {selectedJourney.pages[index + 1].page_title || 
                                shortenUrl(selectedJourney.pages[index + 1].page_url)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
};

export default JourneyVisualizer; 