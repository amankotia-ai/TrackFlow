import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";
import { fadeIn, slideUp, staggerContainer } from "@/lib/animations";
import { Tables } from "@/integrations/supabase/types";
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ChevronRight, Plus } from "lucide-react";
import RulesList from '@/components/rules/RulesList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RulesListSkeleton } from "@/components/ui/skeletons";
import CreateRuleModal from '@/components/rules/CreateRuleModal';

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

interface CampaignWithRules {
  campaign: Campaign;
  rules: ContentRule[];
}

const AllRules: React.FC = () => {
  const [campaignsWithRules, setCampaignsWithRules] = useState<CampaignWithRules[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const { toast } = useToast();
  const navigate = useNavigate();
  
  useEffect(() => {
    fetchCampaignsWithRules();
  }, []);
  
  const fetchCampaignsWithRules = async () => {
    try {
      setLoading(true);
      
      // Fetch all campaigns
      const { data: campaignsData, error: campaignsError } = await supabase
        .from('campaigns')
        .select('*')
        .order('name', { ascending: true });
        
      if (campaignsError) throw campaignsError;
      
      // Fetch all rules
      const { data: rulesData, error: rulesError } = await supabase
        .from('content_rules')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (rulesError) throw rulesError;
      
      // Group rules by campaign
      const campaignsWithRules: CampaignWithRules[] = campaignsData.map((campaign) => {
        const campaignRules = rulesData.filter(rule => rule.campaign_id === campaign.id);
        return {
          campaign,
          rules: campaignRules
        };
      });
      
      // Filter out campaigns with no rules
      const filteredCampaignsWithRules = campaignsWithRules.filter(item => item.rules.length > 0);
      
      setCampaignsWithRules(filteredCampaignsWithRules);
    } catch (error) {
      console.error('Error fetching campaigns and rules:', error);
      toast({
        title: "Error",
        description: "Failed to fetch content rules",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleRuleCreated = () => {
    setIsCreateModalOpen(false);
    fetchCampaignsWithRules();
  };
  
  const handleRuleChange = () => {
    fetchCampaignsWithRules();
  };
  
  const getFilteredCampaignsWithRules = () => {
    if (!searchQuery) return campaignsWithRules;
    
    return campaignsWithRules.map(item => {
      const filteredRules = item.rules.filter(rule => 
        rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (rule.description && rule.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      
      return {
        campaign: item.campaign,
        rules: filteredRules
      };
    }).filter(item => item.rules.length > 0);
  };
  
  const getActiveRulesCampaigns = () => {
    return campaignsWithRules.map(item => {
      const activeRules = item.rules.filter(rule => rule.active);
      
      return {
        campaign: item.campaign,
        rules: activeRules
      };
    }).filter(item => item.rules.length > 0);
  };
  
  const filteredCampaignsWithRules = getFilteredCampaignsWithRules();
  const activeCampaignsWithRules = getActiveRulesCampaigns();
  
  const actionButtons = (
    <div className="flex items-center gap-2">
      <div className="relative w-64">
        <Search className="absolute top-2.5 left-3 h-4 w-4 text-gray-400" />
        <Input 
          className="pl-10 h-9 bg-white" 
          placeholder="Search rules..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      <Button 
        variant="default" 
        size="sm" 
        className="bg-gray-900 text-white hover:bg-gray-800"
        onClick={() => {
          setSelectedCampaignId(campaignsWithRules.length > 0 ? campaignsWithRules[0].campaign.id : null);
          setIsCreateModalOpen(true);
        }}
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Content Rule
      </Button>
    </div>
  );
  
  return (
    <Layout 
      title="All Content Rules"
      subtitle="View and manage all content rules across campaigns"
      showBackButton={false}
      actionButtons={actionButtons}
    >
      <motion.div
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        className="bg-white h-full flex flex-col min-h-[calc(100vh-200px)]"
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col">
          <motion.div variants={slideUp} className="">
            <div className="px-0 py-4">
              <TabsList className="w-full sm:w-auto gap-4 bg-transparent p-0">
                <TabsTrigger 
                  value="all" 
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
              </TabsList>
            </div>
          </motion.div>
          
          <TabsContent value="all" className="px-0 flex-1">
            {loading ? (
              <RulesListSkeleton />
            ) : filteredCampaignsWithRules.length > 0 ? (
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
              >
                {filteredCampaignsWithRules.map((item, index) => (
                  <motion.div
                    key={item.campaign.id}
                    variants={slideUp}
                    custom={index}
                    className="mb-8"
                  >
                    <Card className="border border-gray-100 bg-[#FAFAFA]">
                      <CardHeader className="flex flex-row items-center justify-between p-5 pb-0">
                        <div className="flex flex-col">
                          <CardTitle className="text-xl font-medium flex items-center">
                            {item.campaign.name}
                            <Badge className="ml-2 bg-gray-100 text-gray-600">
                              {item.rules.length} {item.rules.length === 1 ? 'rule' : 'rules'}
                            </Badge>
                          </CardTitle>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-600"
                          onClick={() => navigate(`/campaigns/${item.campaign.id}/content-rules`)}
                        >
                          View Campaign
                          <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                      </CardHeader>
                      <CardContent className="p-5">
                        <RulesList
                          rules={item.rules}
                          loading={false}
                          onRuleChange={handleRuleChange}
                        />
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                variants={slideUp}
                className="text-center py-12 text-gray-600"
              >
                {searchQuery ? 'No rules match your search query' : 'No content rules found'}
              </motion.div>
            )}
          </TabsContent>
          
          <TabsContent value="active" className="px-0 flex-1">
            {loading ? (
              <RulesListSkeleton />
            ) : activeCampaignsWithRules.length > 0 ? (
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
              >
                {activeCampaignsWithRules.map((item, index) => (
                  <motion.div
                    key={item.campaign.id}
                    variants={slideUp}
                    custom={index}
                    className="mb-8"
                  >
                    <Card className="border border-gray-100 bg-[#FAFAFA]">
                      <CardHeader className="flex flex-row items-center justify-between p-5 pb-0">
                        <div className="flex flex-col">
                          <CardTitle className="text-xl font-medium flex items-center">
                            {item.campaign.name}
                            <Badge className="ml-2 bg-gray-100 text-gray-600">
                              {item.rules.length} {item.rules.length === 1 ? 'rule' : 'rules'}
                            </Badge>
                          </CardTitle>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-600"
                          onClick={() => navigate(`/campaigns/${item.campaign.id}/content-rules`)}
                        >
                          View Campaign
                          <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                      </CardHeader>
                      <CardContent className="p-5">
                        <RulesList
                          rules={item.rules}
                          loading={false}
                          onRuleChange={handleRuleChange}
                        />
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                variants={slideUp}
                className="text-center py-12 text-gray-600"
              >
                No active rules found
              </motion.div>
            )}
          </TabsContent>
        </Tabs>
        
        <CreateRuleModal
          open={isCreateModalOpen}
          onOpenChange={setIsCreateModalOpen}
          onRuleCreated={handleRuleCreated}
          campaignId={selectedCampaignId || undefined}
        />
      </motion.div>
    </Layout>
  );
};

export default AllRules; 