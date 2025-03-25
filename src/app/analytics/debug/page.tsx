'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function DebugPage() {
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // last 30 days
    to: new Date(),
  });
  const [journeyData, setJourneyData] = useState<any[]>([]);
  const [clickData, setClickData] = useState<any[]>([]);
  const [mouseData, setMouseData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('journeys');

  const fetchTableCounts = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get counts from each table
      const journeyCount = await supabase
        .from('journey_tracking')
        .select('*', { count: 'exact', head: true });

      const clickCount = await supabase
        .from('click_tracking')
        .select('*', { count: 'exact', head: true });

      const mouseCount = await supabase
        .from('mouse_tracking')
        .select('*', { count: 'exact', head: true });

      return {
        journeys: journeyCount.count || 0,
        clicks: clickCount.count || 0,
        mouse: mouseCount.count || 0,
      };
    } catch (err) {
      console.error('Error fetching table counts:', err);
      setError(`Error fetching table counts: ${err instanceof Error ? err.message : String(err)}`);
      return { journeys: -1, clicks: -1, mouse: -1 };
    } finally {
      setLoading(false);
    }
  };

  const fetchJourneyData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch raw journey tracking data
      const { data, error: fetchError } = await supabase
        .from('journey_tracking')
        .select('*')
        .gte('timestamp', dateRange.from.toISOString())
        .lte('timestamp', dateRange.to.toISOString())
        .order('timestamp', { ascending: false })
        .limit(100);

      if (fetchError) {
        throw fetchError;
      }

      setJourneyData(data || []);
    } catch (err) {
      console.error('Error fetching journey data:', err);
      setError(`Error fetching journey data: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchClickData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch raw click tracking data
      const { data, error: fetchError } = await supabase
        .from('click_tracking')
        .select('*')
        .gte('timestamp', dateRange.from.toISOString())
        .lte('timestamp', dateRange.to.toISOString())
        .order('timestamp', { ascending: false })
        .limit(100);

      if (fetchError) {
        throw fetchError;
      }

      setClickData(data || []);
    } catch (err) {
      console.error('Error fetching click data:', err);
      setError(`Error fetching click data: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchMouseData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch raw mouse movement data
      const { data, error: fetchError } = await supabase
        .from('mouse_tracking')
        .select('*')
        .gte('timestamp', dateRange.from.toISOString())
        .lte('timestamp', dateRange.to.toISOString())
        .order('timestamp', { ascending: false })
        .limit(50);

      if (fetchError) {
        throw fetchError;
      }

      setMouseData(data || []);
    } catch (err) {
      console.error('Error fetching mouse data:', err);
      setError(`Error fetching mouse data: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  // Function to run the get_user_journeys function directly
  const testUserJourneysFunction = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: funcError } = await supabase.rpc('get_user_journeys', {
        p_from_date: dateRange.from.toISOString(),
        p_to_date: dateRange.to.toISOString(),
        p_limit: 100
      });

      if (funcError) {
        throw funcError;
      }

      alert(`Function returned ${data?.length || 0} journeys. Check console for details.`);
      console.log('get_user_journeys result:', data);
    } catch (err) {
      console.error('Error calling get_user_journeys:', err);
      setError(`Error calling get_user_journeys: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  // Load data when tab changes
  useEffect(() => {
    if (activeTab === 'journeys') {
      fetchJourneyData();
    } else if (activeTab === 'clicks') {
      fetchClickData();
    } else if (activeTab === 'mouse') {
      fetchMouseData();
    }
  }, [activeTab, dateRange]);

  // Initialize with table counts
  useEffect(() => {
    (async () => {
      const counts = await fetchTableCounts();
      console.log('Table counts:', counts);
    })();
  }, []);

  const renderJourneyTable = () => {
    if (journeyData.length === 0) {
      return <div className="py-10 text-center text-muted-foreground">No journey data available for the selected date range.</div>;
    }

    return (
      <Table>
        <TableCaption>Raw journey tracking data</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Timestamp</TableHead>
            <TableHead>Journey ID</TableHead>
            <TableHead>Page URL</TableHead>
            <TableHead>Page Title</TableHead>
            <TableHead>Page Sequence</TableHead>
            <TableHead>Previous Page</TableHead>
            <TableHead>Time on Previous (ms)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {journeyData.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{new Date(row.timestamp).toLocaleString()}</TableCell>
              <TableCell className="font-mono text-xs">{row.journey_id}</TableCell>
              <TableCell className="max-w-[200px] truncate" title={row.page_url}>{row.page_url}</TableCell>
              <TableCell className="max-w-[200px] truncate" title={row.page_title}>{row.page_title}</TableCell>
              <TableCell>{row.page_sequence}</TableCell>
              <TableCell className="max-w-[200px] truncate" title={row.previous_page_url}>{row.previous_page_url}</TableCell>
              <TableCell>{row.time_on_previous_page}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  const renderClickTable = () => {
    if (clickData.length === 0) {
      return <div className="py-10 text-center text-muted-foreground">No click data available for the selected date range.</div>;
    }

    return (
      <Table>
        <TableCaption>Raw click tracking data</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Timestamp</TableHead>
            <TableHead>Journey ID</TableHead>
            <TableHead>Page URL</TableHead>
            <TableHead>X</TableHead>
            <TableHead>Y</TableHead>
            <TableHead>Element</TableHead>
            <TableHead>Element Text</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clickData.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{new Date(row.timestamp).toLocaleString()}</TableCell>
              <TableCell className="font-mono text-xs">{row.journey_id}</TableCell>
              <TableCell className="max-w-[200px] truncate" title={row.page_url}>{row.page_url}</TableCell>
              <TableCell>{row.x}</TableCell>
              <TableCell>{row.y}</TableCell>
              <TableCell>{row.element_selector}</TableCell>
              <TableCell className="max-w-[200px] truncate" title={row.element_text}>{row.element_text}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  const renderMouseTable = () => {
    if (mouseData.length === 0) {
      return <div className="py-10 text-center text-muted-foreground">No mouse movement data available for the selected date range.</div>;
    }

    return (
      <Table>
        <TableCaption>Raw mouse movement tracking data</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Timestamp</TableHead>
            <TableHead>Journey ID</TableHead>
            <TableHead>Page URL</TableHead>
            <TableHead>Viewport</TableHead>
            <TableHead>Data Points</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {mouseData.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{new Date(row.timestamp).toLocaleString()}</TableCell>
              <TableCell className="font-mono text-xs">{row.journey_id}</TableCell>
              <TableCell className="max-w-[200px] truncate" title={row.page_url}>{row.page_url}</TableCell>
              <TableCell>{row.viewport_width}×{row.viewport_height}</TableCell>
              <TableCell>{(row.coordinates?.length || 0) + ' points'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Analytics Debugging</CardTitle>
          <CardDescription>
            View raw tracking data and test database functions
          </CardDescription>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pt-4">
            <DateRangePicker
              value={dateRange}
              onChange={setDateRange}
            />
            <Button variant="outline" onClick={testUserJourneysFunction}>
              Test get_user_journeys Function
            </Button>
          </div>
        </CardHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="px-6">
            <TabsList className="mb-4">
              <TabsTrigger value="journeys">Journey Data</TabsTrigger>
              <TabsTrigger value="clicks">Click Data</TabsTrigger>
              <TabsTrigger value="mouse">Mouse Data</TabsTrigger>
            </TabsList>
          </div>

          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : error ? (
              <div className="bg-destructive/10 text-destructive p-4 rounded-md">
                {error}
              </div>
            ) : (
              <>
                <TabsContent value="journeys">
                  {renderJourneyTable()}
                </TabsContent>
                <TabsContent value="clicks">
                  {renderClickTable()}
                </TabsContent>
                <TabsContent value="mouse">
                  {renderMouseTable()}
                </TabsContent>
              </>
            )}
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
} 