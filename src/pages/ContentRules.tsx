import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import ContentRulesDashboard from '@/components/rules/ContentRulesDashboard';
import { useParams } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

type Campaign = Tables<"campaigns">;
type Page = Tables<"pages">;

const ContentRules: React.FC = () => {
  const { campaignId } = useParams<{ campaignId: string }>();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [page, setPage] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    if (campaignId) {
      fetchCampaignDetails();
    }
  }, [campaignId]);

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
    } finally {
      setLoading(false);
    }
  };

  const title = campaign ? `${campaign.name} Content Rules` : "Content Rules";
  const subtitle = page ? `${page.name} • ${page.url ? new URL(page.url).hostname : ''}` : "";

  const handleRuleCreated = () => {
    setIsCreateModalOpen(false);
  };

  const actionButtons = (
    <Button 
      variant="default" 
      size="sm" 
      className="bg-gray-900 text-white hover:bg-gray-800"
      onClick={() => setIsCreateModalOpen(true)}
    >
      <Plus className="h-4 w-4 mr-2" />
      Add Content Rule
    </Button>
  );

  return (
    <Layout 
      title={title}
      subtitle={subtitle}
      showBackButton={false}
      actionButtons={actionButtons}
    >
      <ContentRulesDashboard 
        isCreateModalOpen={isCreateModalOpen}
        setIsCreateModalOpen={setIsCreateModalOpen}
        onRuleCreated={handleRuleCreated}
      />
    </Layout>
  );
};

export default ContentRules; 