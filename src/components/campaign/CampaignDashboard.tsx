import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CampaignList from "./CampaignList";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";
import { fadeIn, slideUp, staggerContainer } from "@/lib/animations";
import { RulesListSkeleton } from "@/components/ui/skeletons";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  source_id: string;
  start_date: string | null;
  end_date: string | null;
  status: string;
  budget: number | null;
  created_at: string;
  updated_at: string;
}

const CampaignDashboard: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("view");
  const location = useLocation();
  const [createModalOpen, setCreateModalOpen] = useState(false);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  // Refetch campaigns when location changes (triggered by layout navigation)
  useEffect(() => {
    fetchCampaigns();
  }, [location.key]);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setCampaigns(data || []);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      toast({
        title: "Error",
        description: "Failed to fetch campaigns",
        variant: "destructive"
      });
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 600);
    }
  };

  const handleCampaignCreated = () => {
    fetchCampaigns();
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
        <h2 className="text-xl font-medium text-gray-900">Manage Campaigns</h2>
        <Button 
          variant="default" 
          size="sm" 
          className="bg-gray-900 text-white hover:bg-gray-800"
          onClick={() => setCreateModalOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Campaign
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
                value="active" 
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-gray-900 data-[state=active]:border-gray-900 data-[state=active]:border-b-2 rounded-none px-1 py-3 text-gray-600 hover:text-gray-900"
              >
                Active
              </TabsTrigger>
              <TabsTrigger 
                value="scheduled" 
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-gray-900 data-[state=active]:border-gray-900 data-[state=active]:border-b-2 rounded-none px-1 py-3 text-gray-600 hover:text-gray-900"
              >
                Scheduled
              </TabsTrigger>
              <TabsTrigger 
                value="completed" 
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-gray-900 data-[state=active]:border-gray-900 data-[state=active]:border-b-2 rounded-none px-1 py-3 text-gray-600 hover:text-gray-900"
              >
                Completed
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
              <CampaignList 
                campaigns={campaigns} 
                loading={loading} 
                onCampaignChange={fetchCampaigns} 
              />
            </motion.div>
          )}
        </TabsContent>
        
        <TabsContent value="active" className="px-0">
          {loading ? (
            <RulesListSkeleton />
          ) : (
            <motion.div 
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              <CampaignList 
                campaigns={campaigns.filter(campaign => campaign.status === 'active')} 
                loading={loading} 
                onCampaignChange={fetchCampaigns} 
              />
            </motion.div>
          )}
        </TabsContent>

        <TabsContent value="scheduled" className="px-0">
          {loading ? (
            <RulesListSkeleton />
          ) : (
            <motion.div 
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              <CampaignList 
                campaigns={campaigns.filter(campaign => campaign.status === 'scheduled')} 
                loading={loading} 
                onCampaignChange={fetchCampaigns} 
              />
            </motion.div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="px-0">
          {loading ? (
            <RulesListSkeleton />
          ) : (
            <motion.div 
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              <CampaignList 
                campaigns={campaigns.filter(campaign => campaign.status === 'completed')} 
                loading={loading} 
                onCampaignChange={fetchCampaigns} 
              />
            </motion.div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Campaign Modal would go here */}
      {/* <CreateCampaignModal 
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onCampaignCreated={handleCampaignCreated}
      /> */}
    </motion.div>
  );
};

export default CampaignDashboard; 