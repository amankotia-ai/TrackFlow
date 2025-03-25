import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";
import { fadeIn, slideUp, staggerContainer } from "@/lib/animations";
import { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Plus, ChevronRight, Search, ArrowUpDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { RulesListSkeleton } from "@/components/ui/skeletons";

type Campaign = Tables<"campaigns">;
type Page = Tables<"pages">;

interface ExtendedCampaign extends Campaign {
  pages: Page;
}

const CAMPAIGN_TYPES = [
  { value: "facebook", label: "Facebook", color: "bg-blue-100 text-blue-800" },
  { value: "seo", label: "SEO", color: "bg-green-100 text-green-800" },
  { value: "linkedin", label: "LinkedIn", color: "bg-sky-100 text-sky-800" },
  { value: "outbound", label: "Outbound", color: "bg-purple-100 text-purple-800" },
  { value: "email", label: "Email", color: "bg-amber-100 text-amber-800" },
  { value: "organic", label: "Organic", color: "bg-lime-100 text-lime-800" },
  { value: "paid", label: "Paid", color: "bg-rose-100 text-rose-800" },
  { value: "custom", label: "Custom", color: "bg-gray-100 text-gray-800" }
];

const CampaignsOverview: React.FC = () => {
  const [campaigns, setCampaigns] = useState<ExtendedCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("all");
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('campaigns')
        .select(`
          *,
          pages:page_id(*)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setCampaigns(data as unknown as ExtendedCampaign[] || []);
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

  const getCampaignTypeInfo = (type: string) => {
    return CAMPAIGN_TYPES.find(t => t.value === type) || CAMPAIGN_TYPES[CAMPAIGN_TYPES.length - 1]; // Default to custom
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = searchQuery === "" || 
      campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (campaign.pages?.name && campaign.pages.name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (activeTab === "all") return matchesSearch;
    if (activeTab === "active") return matchesSearch && campaign.active;
    if (activeTab === "inactive") return matchesSearch && !campaign.active;
    
    return matchesSearch;
  });

  const actionButtons = (
    <div className="flex items-center gap-2">
      <div className="relative w-64">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        <Input 
          placeholder="Search campaigns..." 
          className="pl-9 h-9 bg-white"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      <Button 
        variant="default" 
        size="sm" 
        className="bg-gray-900 text-white hover:bg-gray-800"
        onClick={() => navigate('/pages')}
      >
        <Plus className="h-4 w-4 mr-2" />
        New Campaign
      </Button>
    </div>
  );

  return (
    <Layout 
      title="Campaigns"
      actionButtons={actionButtons}
    >
      <motion.div
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        className="space-y-6 h-full flex flex-col min-h-[calc(100vh-200px)]"
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col">
          <motion.div variants={slideUp}>
            <div className="px-0 py-4">
              <TabsList className="w-full sm:w-auto gap-4 bg-transparent p-0">
                <TabsTrigger 
                  value="all" 
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-gray-900 data-[state=active]:border-gray-900 data-[state=active]:border-b-2 rounded-none px-1 py-3 text-gray-600 hover:text-gray-900"
                >
                  All Campaigns
                </TabsTrigger>
                <TabsTrigger 
                  value="active" 
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-gray-900 data-[state=active]:border-gray-900 data-[state=active]:border-b-2 rounded-none px-1 py-3 text-gray-600 hover:text-gray-900"
                >
                  Active
                </TabsTrigger>
                <TabsTrigger 
                  value="inactive" 
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-gray-900 data-[state=active]:border-gray-900 data-[state=active]:border-b-2 rounded-none px-1 py-3 text-gray-600 hover:text-gray-900"
                >
                  Inactive
                </TabsTrigger>
              </TabsList>
            </div>
          </motion.div>

          <TabsContent value={activeTab} className="mt-0 flex-1">
            {loading ? (
              <RulesListSkeleton />
            ) : filteredCampaigns.length === 0 ? (
              <div className="text-center py-12 border rounded-lg bg-gray-50">
                <p className="text-gray-500 mb-4">No campaigns found</p>
                <Button variant="outline" onClick={() => navigate('/pages')}>
                  Create your first campaign
                </Button>
              </div>
            ) : (
              <motion.div variants={staggerContainer} className="space-y-4">
                {filteredCampaigns.map((campaign, index) => {
                  const typeInfo = getCampaignTypeInfo(campaign.type);
                  
                  return (
                    <motion.div
                      key={campaign.id}
                      variants={slideUp}
                      custom={index}
                      className="border border-gray-100 rounded-lg overflow-hidden hover:shadow-sm transition-shadow bg-[#FAFAFA]"
                    >
                      <div 
                        className="p-4 flex flex-col sm:flex-row justify-between gap-4 cursor-pointer" 
                        onClick={() => navigate(`/campaigns/${campaign.id}/content-rules`)}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-medium">{campaign.name}</h3>
                            <Badge className={`${typeInfo.color} border-none`}>
                              {typeInfo.label}
                            </Badge>
                            {!campaign.active && (
                              <Badge variant="outline" className="bg-gray-100 text-gray-700 border-none">
                                Inactive
                              </Badge>
                            )}
                          </div>
                          
                          {campaign.description && (
                            <p className="text-sm text-gray-500 mb-2">{campaign.description}</p>
                          )}
                          
                          <div className="flex items-center text-xs text-gray-500">
                            <span>Page: </span>
                            <span className="font-medium ml-1">
                              {campaign.pages?.name || "Unknown page"}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 text-gray-400">
                          <span className="text-sm">View rules</span>
                          <ChevronRight className="h-4 w-4" />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>
    </Layout>
  );
};

export default CampaignsOverview; 