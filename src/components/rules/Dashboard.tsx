import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RulesList from "./RulesList";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";
import { fadeIn, slideUp, staggerContainer } from "@/lib/animations";
import { RulesListSkeleton } from "@/components/ui/skeletons";

interface ContentRule {
  id: string;
  name: string;
  description: string | null;
  selector: string;
  condition_type: string;
  condition_value: string;
  replacement_content: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

const Dashboard: React.FC = () => {
  const [rules, setRules] = useState<ContentRule[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("view");
  const location = useLocation();

  useEffect(() => {
    fetchRules();
  }, []);

  // Refetch rules when location changes (triggered by layout navigation)
  useEffect(() => {
    fetchRules();
  }, [location.key]);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('content_rules')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setRules(data || []);
    } catch (error) {
      console.error('Error fetching rules:', error);
      toast({
        title: "Error",
        description: "Failed to fetch content rules",
        variant: "destructive"
      });
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 600);
    }
  };

  const handleRuleCreated = () => {
    fetchRules();
    setActiveTab("view");
  };

  return (
    <motion.div
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      className="bg-white"
    >
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
              <TabsTrigger 
                value="shared" 
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-gray-900 data-[state=active]:border-gray-900 data-[state=active]:border-b-2 rounded-none px-1 py-3 text-gray-600 hover:text-gray-900"
              >
                Shared
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
              <RulesList 
                rules={rules} 
                loading={loading} 
                onRuleChange={fetchRules} 
              />
            </motion.div>
          )}
        </TabsContent>
        
        <TabsContent value="recent" className="px-0">
          <div className="text-left text-gray-600">
            Recent items will appear here
          </div>
        </TabsContent>

        <TabsContent value="favorites" className="px-0">
          <div className="text-left text-gray-600">
            Favorite items will appear here
          </div>
        </TabsContent>

        <TabsContent value="shared" className="px-0">
          <div className="text-left text-gray-600">
            Shared items will appear here
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default Dashboard;
