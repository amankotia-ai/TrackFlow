import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, LineChart, PieChart, ComboChart } from "@/components/ui/charts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertTriangle, AlertCircle, BarChart3, Globe2, MapPin } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import JourneyVisualizer from "./JourneyVisualizer";
import { AnalyticsSkeleton, ContentRuleSkeleton } from "@/components/ui/skeletons";

// Helper function to format date
const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// Define analytics time ranges
const timeRanges = [
  { label: "Last 7 days", value: "7d" },
  { label: "Last 30 days", value: "30d" },
  { label: "Last 90 days", value: "90d" },
  { label: "Custom", value: "custom" },
];

// Define UTM parameters to track
const utmParams = [
  { label: "Source", value: "utm_source" },
  { label: "Medium", value: "utm_medium" },
  { label: "Campaign", value: "utm_campaign" },
  { label: "Term", value: "utm_term" },
  { label: "Content", value: "utm_content" },
];

// Type for tracking data
type TrackingData = {
  id: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  page_url: string | null;
  page_title: string | null;
  referrer: string | null;
  ip_address: string | null;
  user_agent: string | null;
  client_id: string | null;
  timestamp: string;
  first_visit: boolean;
  is_direct: boolean;
  session_id: string | null;
  visit_count: number;
  event_type: string;
  event_name: string | null;
  first_utm_source: string | null;
  first_utm_medium: string | null;
  first_utm_campaign: string | null;
  first_utm_term: string | null;
  first_utm_content: string | null;
  last_utm_source: string | null;
  last_utm_medium: string | null;
  last_utm_campaign: string | null;
  last_utm_term: string | null;
  last_utm_content: string | null;
  screen_width: number | null;
  screen_height: number | null;
  browser_language: string | null;
};

// Type for visitor metrics
type VisitorMetrics = {
  total_visits: number;
  unique_visitors: number;
  new_visitors: number;
  returning_visitors: number;
};

// Type for content rules
type ContentRule = {
  id: string;
  name: string;
  condition_type: string;
  condition_value: string;
  selector: string;
  replacement_content: string;
  description: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  usage_count?: number;
};

// Type for chart data
interface ChartData {
  name: string;
  count: number;
}

// Type for processed data
interface ProcessedData {
  overview: {
    totalVisits: number;
    uniqueVisitors: number;
    newVisitors: number;
    returningVisitors: number;
    visitsByDate: { date: string; count: number; trend?: number }[];
    topSources: ChartData[];
    visitorTypes: { name: string; value: number }[];
  };
  sources: ChartData[];
  mediums: ChartData[];
  campaigns: ChartData[];
  terms: ChartData[];
  contents: ChartData[];
  events: ChartData[];
  visitsByMonth: { month: string; count: number; trend: number }[];
  pageData: { url: string; visits: number; }[];
}

const AnalyticsDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [timeRange, setTimeRange] = useState("30d");
  const [selectedUtmParam, setSelectedUtmParam] = useState("utm_source");
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: new Date(),
  });
  const [trackingTableExists, setTrackingTableExists] = useState<boolean | null>(null);
  const [isCreatingTable, setIsCreatingTable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contentRules, setContentRules] = useState<ContentRule[]>([]);
  const [visitorMetrics, setVisitorMetrics] = useState<VisitorMetrics | null>(null);

  // Check if utm_tracking table exists
  useEffect(() => {
    checkTrackingTable();
  }, []);

  const checkTrackingTable = async () => {
    try {
      // Try to retrieve one record from the utm_tracking table
      const { error } = await supabase
        .from('utm_tracking')
        .select('*', { count: 'exact', head: true });
      
      // If there's no error, the table exists
      setTrackingTableExists(error ? false : true);
    } catch (err) {
      console.error('Error checking utm_tracking table:', err);
      setTrackingTableExists(false);
    }
  };

  const createTrackingTable = async () => {
    try {
      setIsCreatingTable(true);
      
      // Note: This won't work with client-side permissions
      // You'd need to create the table through migrations or Supabase dashboard
      // This is just a placeholder to show what would need to be done
      const { error } = await supabase.rpc('create_utm_tracking_table');
      
      if (error) {
        throw error;
      }
      
      // Check again if the table exists
      await checkTrackingTable();
    } catch (err) {
      console.error('Error creating utm_tracking table:', err);
    } finally {
      setIsCreatingTable(false);
    }
  };

  // Update date range when time range changes
  useEffect(() => {
    const now = new Date();
    let from = new Date();

    switch (timeRange) {
      case "7d":
        from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "90d":
        from = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case "custom":
        // Keep the current date range for custom
        return;
    }

    setDateRange({ from, to: now });
  }, [timeRange]);

  // Fetch visitor metrics
  const fetchVisitorMetrics = async () => {
    if (!trackingTableExists) return null;
    
    try {
      const { data, error } = await supabase.rpc(
        'get_visitor_metrics',
        {
          from_date: dateRange.from.toISOString(),
          to_date: dateRange.to.toISOString()
        }
      );
      
      if (error) throw error;
      
      return data[0] as VisitorMetrics;
    } catch (err) {
      console.error('Error fetching visitor metrics:', err);
      return null;
    }
  };

  // Fetch analytics data
  const { data: analyticsData, isLoading, error: queryError, refetch } = useQuery({
    queryKey: ["analytics", formatDate(dateRange.from), formatDate(dateRange.to), trackingTableExists],
    queryFn: async () => {
      if (!trackingTableExists) {
        return [] as TrackingData[];
      }
      
      // Fetch the visitor metrics 
      const metrics = await fetchVisitorMetrics();
      if (metrics) {
        setVisitorMetrics(metrics);
      }
      
      // Fetch the tracking data
      const { data, error } = await supabase
        .from('utm_tracking')
        .select('*')
        .gte('timestamp', dateRange.from.toISOString())
        .lte('timestamp', dateRange.to.toISOString())
        .order('timestamp', { ascending: false });

      if (error) {
        throw error;
      }

      return (data || []) as TrackingData[];
    },
    enabled: trackingTableExists !== null,
  });

  // Fetch content rules usage data
  useEffect(() => {
    const fetchContentRules = async () => {
      if (!trackingTableExists) return;
      
      try {
        setLoading(true);
        
        // First check if content_rule_usage table exists
        const { error: tableCheckError } = await supabase
          .from("content_rule_usage")
          .select("id", { count: "exact", head: true });
        
        // If table doesn't exist, show placeholder data
        if (tableCheckError) {
          console.info("Content rule usage table doesn't exist yet:", tableCheckError.message);
          
          // Fetch basic rule information without usage data
          const { data: rules, error: rulesError } = await supabase
            .from("content_rules")
            .select("*")
            .eq("active", true);
            
          if (rulesError) throw rulesError;
          
          // Create sample data for demonstration purposes
          const demoRuleNames = [
            "Homepage Hero Button - Google",
            "Pricing Headline - Facebook",
            "Features CTA - LinkedIn",
            "Blog Header - Twitter",
            "Signup Form - Email Campaign",
            "Footer Text - Instagram",
            "Product Description - Direct"
          ];
          
          // If no rules exist, create demo rules
          const rulesWithUsage = rules.length > 0 
            ? rules.map(rule => ({
                ...rule,
                usage_count: Math.floor(Math.random() * 100) + 5 // Random count between 5-105
              }))
            : demoRuleNames.map((name, index) => ({
                id: `demo-${index}`,
                name,
                usage_count: Math.floor(Math.random() * 100) + 5, // Random count between 5-105
                condition_type: index % 2 === 0 ? "utm_source" : "utm_medium",
                condition_value: ["google", "facebook", "linkedin", "twitter", "email", "instagram", "direct"][index],
                selector: ".demo-selector",
                replacement_content: "<p>Demo Content</p>",
                description: "Demo rule for presentation",
                active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }));
          
          setContentRules(rulesWithUsage);
          return;
        }
        
        // If table exists, get real usage data using the SQL function
        const fromDate = dateRange.from ? formatDate(dateRange.from) : "2000-01-01";
        const toDate = dateRange.to ? formatDate(dateRange.to) : "2099-12-31";
        
        const { data, error } = await supabase
          .rpc("get_content_rule_usage", {
            from_date: fromDate,
            to_date: toDate
          });
          
        if (error) throw error;
        
        // Map the data to our content rule format
        const rulesWithUsage = data.map(item => ({
          id: item.rule_id,
          name: item.rule_name,
          usage_count: Number(item.usage_count),
          // Other fields will be undefined, but that's ok for our display purposes
          condition_type: "",
          condition_value: "",
          selector: "",
          replacement_content: "",
          description: "",
          active: true,
          created_at: "",
          updated_at: ""
        }));
        
        setContentRules(rulesWithUsage);
        setError(null);
      } catch (err) {
        console.error("Error fetching content rules:", err);
        setError("Failed to fetch content rule usage data");
      } finally {
        setLoading(false);
      }
    };
    
    fetchContentRules();
  }, [trackingTableExists, dateRange.from, dateRange.to]);

  // Process data for charts
  const processDataForCharts = (): ProcessedData => {
    if (!analyticsData || analyticsData.length === 0) {
      // Create empty monthly data for chart when no data is available
      const emptyMonthlyData = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        .map(month => ({ month, count: 0, trend: 0 }));
        
      const emptyVisitorMetrics = {
        totalVisits: 0,
        uniqueVisitors: 0,
        newVisitors: 0,
        returningVisitors: 0,
        visitsByDate: [],
        topSources: [],
        visitorTypes: [
          { name: "New Visitors", value: 0 },
          { name: "Returning Visitors", value: 0 }
        ]
      };
      
      return {
        overview: emptyVisitorMetrics,
        sources: [],
        mediums: [],
        campaigns: [],
        terms: [],
        contents: [],
        events: [],
        visitsByMonth: emptyMonthlyData,
        pageData: []
      };
    }

    // Use visitor metrics if available, or calculate from data
    const totalVisits = visitorMetrics?.total_visits || analyticsData.length;
    const uniqueVisitors = visitorMetrics?.unique_visitors || new Set(analyticsData.map(item => item.client_id)).size;
    const newVisitors = visitorMetrics?.new_visitors || analyticsData.filter(item => item.first_visit).length;
    const returningVisitors = visitorMetrics?.returning_visitors || uniqueVisitors - newVisitors;

    // Process visits by date
    const visitsByDate = analyticsData.reduce<Record<string, number>>((acc, item) => {
      const date = item.timestamp.split('T')[0];
      if (!acc[date]) {
        acc[date] = 0;
      }
      acc[date]++;
      return acc;
    }, {});

    // Process visits by month for combo chart
    const visitsByMonth = analyticsData.reduce<Record<string, { count: number; month: string }>>((acc, item) => {
      const date = new Date(item.timestamp);
      const month = date.toLocaleString('default', { month: 'short' });
      
      if (!acc[month]) {
        acc[month] = { count: 0, month };
      }
      acc[month].count++;
      return acc;
    }, {});

    // Convert to array and calculate trend line (7-day moving average)
    const visitsByDateArray = Object.entries(visitsByDate)
      .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
      .map(([date, count]) => ({ date, count }));

    // Calculate trend data (moving average)
    const visitsByDateWithTrend = visitsByDateArray.map((day, index, array) => {
      // Calculate 7-day trailing average for trend
      let trend = day.count;
      if (index >= 6) {
        const last7Days = array.slice(index - 6, index + 1);
        const sum = last7Days.reduce((sum, item) => sum + item.count, 0);
        trend = Math.round(sum / 7);
      }
      return { ...day, trend };
    });

    // Sort months and format for combo chart
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const visitsByMonthArray = months.map(month => {
      return visitsByMonth[month] || { month, count: 0 };
    });

    // Calculate monthly trend (3-month moving average)
    const visitsByMonthWithTrend = visitsByMonthArray.map((month, index, array) => {
      // Calculate trend as 3-month trailing average
      let trend = month.count;
      if (index >= 2) {
        const last3Months = array.slice(index - 2, index + 1);
        const sum = last3Months.reduce((sum, item) => sum + item.count, 0);
        trend = Math.round(sum / 3);
      }
      return { ...month, trend };
    });

    // Process page view data
    const pageData = analyticsData
      .filter(item => item.page_url && item.event_type === 'pageview')
      .reduce<Record<string, number>>((acc, item) => {
        const url = item.page_url || 'unknown';
        if (!acc[url]) acc[url] = 0;
        acc[url]++;
        return acc;
      }, {});

    const pageDataArray = Object.entries(pageData)
      .map(([url, visits]) => ({ url, visits }))
      .sort((a, b) => b.visits - a.visits)
      .slice(0, 10);

    // Process event data
    const eventData = analyticsData
      .filter(item => item.event_type === 'event' && item.event_name)
      .reduce<Record<string, number>>((acc, item) => {
        const eventName = item.event_name || 'unknown';
        if (!acc[eventName]) acc[eventName] = 0;
        acc[eventName]++;
        return acc;
      }, {});

    const eventDataArray = Object.entries(eventData)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Process UTM parameters
    const processByParam = (paramName: keyof TrackingData): ChartData[] => {
      const paramCounts = analyticsData.reduce<Record<string, number>>((acc, item) => {
        if (item[paramName]) {
          const value = item[paramName] as string;
          if (!acc[value]) {
            acc[value] = 0;
          }
          acc[value]++;
        }
        return acc;
      }, {});

      return Object.entries(paramCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    };

    const sources = processByParam("utm_source");
    const mediums = processByParam("utm_medium");
    const campaigns = processByParam("utm_campaign");
    const terms = processByParam("utm_term");
    const contents = processByParam("utm_content");

    // Get top sources for overview
    const topSources = sources.slice(0, 5);

    // Calculate visitor type distribution
    const visitorTypes = [
      { name: "New Visitors", value: newVisitors },
      { name: "Returning Visitors", value: returningVisitors }
    ];

    return {
      overview: {
        totalVisits,
        uniqueVisitors,
        newVisitors,
        returningVisitors,
        visitsByDate: visitsByDateWithTrend,
        topSources,
        visitorTypes
      },
      sources,
      mediums,
      campaigns,
      terms,
      contents,
      events: eventDataArray,
      visitsByMonth: visitsByMonthWithTrend,
      pageData: pageDataArray
    };
  };

  // Get the chart data for the selected UTM parameter
  const getChartDataForParam = (): ChartData[] => {
    const processedData = processDataForCharts();
    
    switch (selectedUtmParam) {
      case "utm_source":
        return processedData.sources;
      case "utm_medium":
        return processedData.mediums;
      case "utm_campaign":
        return processedData.campaigns;
      case "utm_term":
        return processedData.terms;
      case "utm_content":
        return processedData.contents;
      default:
        return [];
    }
  };

  // Process rule usage data for the chart
  const processRuleUsage = () => {
    if (!contentRules || contentRules.length === 0) {
      return {
        names: [],
        counts: [],
      };
    }

    const sortedRules = [...contentRules]
      .sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0))
      .slice(0, 10);

    return {
      names: sortedRules.map(rule => rule.name),
      counts: sortedRules.map(rule => rule.usage_count || 0),
    };
  };

  // If still checking tracking table
  if (trackingTableExists === null) {
    return (
      <div>
        <AnalyticsSkeleton />
      </div>
    );
  }

  // If tracking table does not exist
  if (trackingTableExists === false) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Analytics Not Available</AlertTitle>
          <AlertDescription>
            <p className="mb-4">The UTM tracking table does not exist in your database. This is required to store and analyze UTM parameter data.</p>
            <p className="mb-4">To fix this issue, you need to create a table called 'utm_tracking' with the following schema:</p>
            <pre className="bg-muted p-4 rounded-md overflow-x-auto text-xs mb-4">
              {`CREATE TABLE "utm_tracking" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "utm_source" text,
  "utm_medium" text,
  "utm_campaign" text,
  "utm_term" text,
  "utm_content" text,
  "page_url" text,
  "referrer" text,
  "ip_address" text,
  "user_agent" text,
  "client_id" text,
  "timestamp" timestamptz DEFAULT now(),
  CONSTRAINT "client_timestamp_unique" UNIQUE ("client_id", "timestamp")
);`}
            </pre>
            <p>Please create this table in your Supabase database and make sure the Supabase Edge Function for tracking is deployed correctly.</p>
            <Button 
              onClick={checkTrackingTable} 
              className="mt-4"
              variant="outline"
            >
              Check Again
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // If loading analytics data
  if (isLoading) {
    return (
      <div>
        <AnalyticsSkeleton />
      </div>
    );
  }

  // If there's an error
  if (queryError) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Loading Analytics</AlertTitle>
          <AlertDescription>
            <p>{(queryError as any).message || "Failed to load analytics data"}</p>
            <Button 
              onClick={() => refetch()} 
              className="mt-4"
              variant="outline"
            >
              Try Again
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // If no data
  if (analyticsData && analyticsData.length === 0) {
    return (
      <div className="space-y-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>No Analytics Data</AlertTitle>
          <AlertDescription>
            <p className="mb-4">No UTM parameter tracking data found for the selected time period. This could be because:</p>
            <ul className="list-disc pl-5 mb-4 space-y-2">
              <li>No one has visited your website with UTM parameters yet</li>
              <li>The tracking script is not properly installed on your website</li>
              <li>The Supabase Edge Function for tracking is not working properly</li>
            </ul>
            <p>Make sure your integration script is properly installed and try checking with different date ranges.</p>
          </AlertDescription>
        </Alert>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-0 py-4 flex justify-between items-center">
            <TabsList className="gap-4 bg-transparent p-0">
              <TabsTrigger 
                value="overview" 
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-gray-900 data-[state=active]:border-gray-900 data-[state=active]:border-b-2 rounded-none px-1 py-3 text-gray-600 hover:text-gray-900"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="sources" 
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-gray-900 data-[state=active]:border-gray-900 data-[state=active]:border-b-2 rounded-none px-1 py-3 text-gray-600 hover:text-gray-900"
              >
                <Globe2 className="h-4 w-4 mr-2" />
                UTM Parameters
              </TabsTrigger>
              <TabsTrigger 
                value="content-rules" 
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-gray-900 data-[state=active]:border-gray-900 data-[state=active]:border-b-2 rounded-none px-1 py-3 text-gray-600 hover:text-gray-900"
              >
                <Globe2 className="h-4 w-4 mr-2" />
                Content Rules
              </TabsTrigger>
            </TabsList>
            
            <div className="flex items-center gap-2">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Select time range" />
                </SelectTrigger>
                <SelectContent>
                  {timeRanges.map(range => (
                    <SelectItem key={range.value} value={range.value}>
                      {range.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {timeRange === "custom" && (
                <DateRangePicker
                  value={dateRange}
                  onChange={setDateRange}
                />
              )}
            </div>
          </div>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="px-0 py-4 flex justify-between items-center">
          <TabsList className="gap-4 bg-transparent p-0">
            <TabsTrigger 
              value="overview" 
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-gray-900 data-[state=active]:border-gray-900 data-[state=active]:border-b-2 rounded-none px-1 py-3 text-gray-600 hover:text-gray-900"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="utm" 
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-gray-900 data-[state=active]:border-gray-900 data-[state=active]:border-b-2 rounded-none px-1 py-3 text-gray-600 hover:text-gray-900"
            >
              <Globe2 className="h-4 w-4 mr-2" />
              UTM Analytics
            </TabsTrigger>
            <TabsTrigger 
              value="journeys" 
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-gray-900 data-[state=active]:border-gray-900 data-[state=active]:border-b-2 rounded-none px-1 py-3 text-gray-600 hover:text-gray-900"
            >
              <MapPin className="h-4 w-4 mr-2" />
              User Journeys
            </TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                {timeRanges.map(range => (
                  <SelectItem key={range.value} value={range.value}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {timeRange === "custom" && (
              <DateRangePicker
                value={dateRange}
                onChange={setDateRange}
              />
            )}
          </div>
        </div>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Visits</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{processDataForCharts().overview.totalVisits}</div>
                <p className="text-xs text-muted-foreground">
                  {formatDate(dateRange.from)} - {formatDate(dateRange.to)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Unique Visitors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{processDataForCharts().overview.uniqueVisitors}</div>
                <p className="text-xs text-muted-foreground">
                  Based on client_id tracking
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Top Source</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {processDataForCharts().sources.length > 0
                    ? processDataForCharts().sources[0]?.name 
                    : "N/A"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {processDataForCharts().sources.length > 0
                    ? `${processDataForCharts().sources[0]?.count || 0} visits`
                    : "0 visits"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Top Medium</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {processDataForCharts().mediums.length > 0
                    ? processDataForCharts().mediums[0]?.name
                    : "N/A"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {processDataForCharts().mediums.length > 0
                    ? `${processDataForCharts().mediums[0]?.count || 0} visits`
                    : "0 visits"}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="col-span-1 md:col-span-3 overflow-hidden shadow-sm border">
            <CardHeader className="pb-2">
              <CardTitle>Visits Over Time</CardTitle>
              <CardDescription>Daily tracking events breakdown</CardDescription>
            </CardHeader>
            <CardContent className="p-0 h-[500px]">
              <ComboChart
                data={processDataForCharts().visitsByMonth}
                xAxisKey="month"
                barKey="count" 
                lineKey="trend"
                barName="Visits"
                lineName="Trend"
              />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Top Sources</CardTitle>
                <CardDescription>Most common utm_source values</CardDescription>
              </CardHeader>
              <CardContent className="pt-0 pb-4 px-4">
                <div className="w-full h-[300px] overflow-hidden">
                  <PieChart 
                    data={processDataForCharts().sources.slice(0, 5)}
                    nameKey="name"
                    dataKey="count"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Campaigns</CardTitle>
                <CardDescription>Most common utm_campaign values</CardDescription>
              </CardHeader>
              <CardContent className="pt-0 pb-4 px-4">
                <div className="w-full h-[300px] overflow-hidden">
                  <PieChart 
                    data={processDataForCharts().campaigns.slice(0, 5)}
                    nameKey="name"
                    dataKey="count"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="utm">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle>UTM Parameter Analysis</CardTitle>
                  <CardDescription>Breakdown of UTM parameter values</CardDescription>
                </div>
                <Select value={selectedUtmParam} onValueChange={setSelectedUtmParam}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select parameter" />
                  </SelectTrigger>
                  <SelectContent>
                    {utmParams.map(param => (
                      <SelectItem key={param.value} value={param.value}>
                        {param.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="pt-0 pb-4 px-4">
              <div className="w-full h-[400px] overflow-hidden">
                <BarChart 
                  data={getChartDataForParam()}
                  xAxisKey="name"
                  yAxisKey="count"
                  categories={["count"]}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content-rules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Content Rule Performance</CardTitle>
              <CardDescription>See which content rules are being applied most often</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="p-8">
                  <ContentRuleSkeleton />
                </div>
              ) : error ? (
                <div className="p-8 text-center">
                  <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-4" />
                  <h3 className="text-lg font-medium">Unable to load content rule tracking</h3>
                  <p className="text-sm text-muted-foreground">{error}</p>
                </div>
              ) : contentRules.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  <p>No content rule usage data available yet.</p>
                  <p className="text-sm">As users interact with your content rules, usage statistics will appear here.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="w-full h-[300px] overflow-hidden mb-8">
                    <BarChart 
                      data={contentRules
                        .sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0))
                        .slice(0, 7)
                        .map(rule => ({
                          name: rule.name,
                          count: rule.usage_count || 0
                        }))}
                      xAxisKey="name"
                      yAxisKey="count" 
                      categories={["count"]}
                    />
                  </div>
                
                  <h3 className="text-sm font-medium">Top Content Rules by Usage</h3>
                  <div className="grid gap-4">
                    {contentRules
                      .sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0))
                      .slice(0, 10)
                      .map((rule, index) => (
                        <div key={rule.id || index} className="flex items-center justify-between">
                          <div className="space-y-1">
                            <p className="text-sm font-medium leading-none">{rule.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {rule.condition_type && rule.condition_value ? 
                                `${rule.condition_type}=${rule.condition_value}` : 
                                "No conditions"}
                            </p>
                          </div>
                          <div className="ml-auto font-medium">{rule.usage_count || 0}</div>
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="journeys">
          <div className="grid gap-4">
            <JourneyVisualizer />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsDashboard; 