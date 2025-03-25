import React, { useState, useEffect } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RulesList from "./RulesList";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";
import { fadeIn, slideUp, staggerContainer } from "@/lib/animations";
import { RulesListSkeleton } from "@/components/ui/skeletons";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import CreateRuleModal from "./CreateRuleModal";

interface ContentRule {
  id: string;
  name: string;
  description: string | null;
  selector: string;
  condition_type: string;
  condition_value: string;
  replacement_content: string;
  active: boolean;
  campaign_id: string | null;
  created_at: string;
  updated_at: string;
}

type Campaign = Tables<"campaigns">;
type Page = Tables<"pages">;

interface ContentRulesDashboardProps {
  isCreateModalOpen?: boolean;
  setIsCreateModalOpen?: (open: boolean) => void;
  onRuleCreated?: () => void;
}

const ContentRulesDashboard: React.FC<ContentRulesDashboardProps> = ({
  isCreateModalOpen = false,
  setIsCreateModalOpen = () => {},
  onRuleCreated = () => {}
}) => {
  const { campaignId } = useParams<{ campaignId: string }>();
  const [rules, setRules] = useState<ContentRule[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("view");
  const location = useLocation();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [page, setPage] = useState<Page | null>(null);

  useEffect(() => {
    if (campaignId) {
      fetchCampaignDetails();
      fetchRules();
    }
  }, [campaignId]);

  // Refetch rules when location changes (triggered by layout navigation)
  useEffect(() => {
    if (campaignId) {
      fetchRules();
    }
  }, [location.key]);

  const fetchCampaignDetails = async () => {
    if (!campaignId) return;
    
    try {
      // Fetch campaign details
      const { data: campaignData, error: campaignError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();
        
      if (campaignError) throw campaignError;
      setCampaign(campaignData);

      // Fetch page details for the campaign
      if (campaignData?.page_id) {
        const { data: pageData, error: pageError } = await supabase
          .from('pages')
          .select('*')
          .eq('id', campaignData.page_id)
          .single();
          
        if (pageError) throw pageError;
        setPage(pageData);
      }
    } catch (error) {
      console.error('Error fetching campaign details:', error);
      toast({
        title: "Error",
        description: "Failed to fetch campaign details",
        variant: "destructive"
      });
    }
  };

  const fetchRules = async () => {
    if (!campaignId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('content_rules')
        .select('*')
        .eq('campaign_id', campaignId)
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
    onRuleCreated();
  };

  if (!campaignId || !campaign) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Campaign not found or loading...</p>
      </div>
    );
  }

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
                All Rules
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
        
        <TabsContent value="active" className="px-0">
          {loading ? (
            <RulesListSkeleton />
          ) : (
            <motion.div 
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              <RulesList 
                rules={rules.filter(rule => rule.active)} 
                loading={loading} 
                onRuleChange={fetchRules} 
              />
            </motion.div>
          )}
        </TabsContent>

        <TabsContent value="recent" className="px-0">
          {loading ? (
            <RulesListSkeleton />
          ) : (
            <motion.div 
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              <RulesList 
                rules={rules.slice(0, 5)} 
                loading={loading} 
                onRuleChange={fetchRules} 
              />
            </motion.div>
          )}
        </TabsContent>
      </Tabs>
      
      <CreateRuleModal 
        open={isCreateModalOpen} 
        onOpenChange={setIsCreateModalOpen}
        onRuleCreated={handleRuleCreated}
        campaignId={campaignId}
      />
    </motion.div>
  );
};

export default ContentRulesDashboard; 