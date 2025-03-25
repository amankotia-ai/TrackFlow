import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PagesList from "./PagesList";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";
import { fadeIn, slideUp, staggerContainer } from "@/lib/animations";
import { RulesListSkeleton } from "@/components/ui/skeletons";
import { Tables } from "@/integrations/supabase/types";

type Page = Tables<"pages">;

const PagesDashboard: React.FC = () => {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("view");
  const location = useLocation();

  useEffect(() => {
    fetchPages();
  }, []);

  // Refetch pages when location changes (triggered by layout navigation)
  useEffect(() => {
    fetchPages();
  }, [location.key]);

  const fetchPages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setPages(data || []);
    } catch (error) {
      console.error('Error fetching pages:', error);
      toast({
        title: "Error",
        description: "Failed to fetch pages",
        variant: "destructive"
      });
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 600);
    }
  };

  return (
    <motion.div
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      className="bg-white h-full flex flex-col"
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col">
        <motion.div variants={slideUp} className="">
          <div className="px-0 py-4">
            <TabsList className="w-full sm:w-auto gap-4 bg-transparent p-0">
              <TabsTrigger 
                value="view" 
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-gray-900 data-[state=active]:border-gray-900 data-[state=active]:border-b-2 rounded-none px-1 py-3 text-gray-600 hover:text-gray-900"
              >
                All Pages
              </TabsTrigger>
              <TabsTrigger 
                value="active" 
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-gray-900 data-[state=active]:border-gray-900 data-[state=active]:border-b-2 rounded-none px-1 py-3 text-gray-600 hover:text-gray-900"
              >
                Active
              </TabsTrigger>
              <TabsTrigger 
                value="recent" 
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-gray-900 data-[state=active]:border-gray-900 data-[state=active]:border-b-2 rounded-none px-1 py-3 text-gray-600 hover:text-gray-900"
              >
                Recent
              </TabsTrigger>
            </TabsList>
          </div>
        </motion.div>

        <TabsContent value="view" className="px-0 flex-1">
          {loading ? (
            <RulesListSkeleton />
          ) : (
            <motion.div 
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              <PagesList 
                pages={pages} 
                loading={loading} 
                onPageChange={fetchPages} 
              />
            </motion.div>
          )}
        </TabsContent>
        
        <TabsContent value="active" className="px-0 flex-1">
          {loading ? (
            <RulesListSkeleton />
          ) : (
            <motion.div 
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              <PagesList 
                pages={pages.filter(page => page.active)} 
                loading={loading} 
                onPageChange={fetchPages} 
              />
            </motion.div>
          )}
        </TabsContent>

        <TabsContent value="recent" className="px-0 flex-1">
          {loading ? (
            <RulesListSkeleton />
          ) : (
            <motion.div 
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              <PagesList 
                pages={pages.slice(0, 5)} 
                loading={loading} 
                onPageChange={fetchPages} 
              />
            </motion.div>
          )}
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default PagesDashboard; 