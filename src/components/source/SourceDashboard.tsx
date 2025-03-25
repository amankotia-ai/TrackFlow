import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SourceList from "./SourceList";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";
import { fadeIn, slideUp, staggerContainer } from "@/lib/animations";
import { RulesListSkeleton } from "@/components/ui/skeletons";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface Source {
  id: string;
  name: string;
  description: string | null;
  type: string;
  created_at: string;
  updated_at: string;
}

const SourceDashboard: React.FC = () => {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("view");
  const location = useLocation();
  const [createModalOpen, setCreateModalOpen] = useState(false);

  useEffect(() => {
    fetchSources();
  }, []);

  // Refetch sources when location changes (triggered by layout navigation)
  useEffect(() => {
    fetchSources();
  }, [location.key]);

  const fetchSources = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('sources')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setSources(data || []);
    } catch (error) {
      console.error('Error fetching sources:', error);
      toast({
        title: "Error",
        description: "Failed to fetch sources",
        variant: "destructive"
      });
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 600);
    }
  };

  const handleSourceCreated = () => {
    fetchSources();
    setActiveTab("view");
  };

  return (
    <motion.div
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      className="bg-white"
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-medium text-gray-900">Manage Sources</h2>
        <Button 
          variant="default" 
          size="sm" 
          className="bg-gray-900 text-white hover:bg-gray-800"
          onClick={() => setCreateModalOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Source
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <motion.div variants={slideUp} className="">
          <div className="px-0 py-4">
            <TabsList className="w-full sm:w-auto gap-4 bg-transparent p-0">
              <TabsTrigger 
                value="view" 
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-gray-900 data-[state=active]:border-gray-900 data-[state=active]:border-b-2 rounded-none px-1 py-3 text-gray-600 hover:text-gray-900"
              >
                View all
              </TabsTrigger>
              <TabsTrigger 
                value="recent" 
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-gray-900 data-[state=active]:border-gray-900 data-[state=active]:border-b-2 rounded-none px-1 py-3 text-gray-600 hover:text-gray-900"
              >
                Recent
              </TabsTrigger>
              <TabsTrigger 
                value="favorites" 
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-gray-900 data-[state=active]:border-gray-900 data-[state=active]:border-b-2 rounded-none px-1 py-3 text-gray-600 hover:text-gray-900"
              >
                Favorites
              </TabsTrigger>
            </TabsList>
          </div>
        </motion.div>

        <TabsContent value="view" className="px-0">
          {loading ? (
            <RulesListSkeleton />
          ) : (
            <motion.div 
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              <SourceList 
                sources={sources} 
                loading={loading} 
                onSourceChange={fetchSources} 
              />
            </motion.div>
          )}
        </TabsContent>
        
        <TabsContent value="recent" className="px-0">
          <div className="text-left text-gray-600">
            Recent sources will appear here
          </div>
        </TabsContent>

        <TabsContent value="favorites" className="px-0">
          <div className="text-left text-gray-600">
            Favorite sources will appear here
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Source Modal would go here */}
      {/* <CreateSourceModal 
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSourceCreated={handleSourceCreated}
      /> */}
    </motion.div>
  );
};

export default SourceDashboard; 