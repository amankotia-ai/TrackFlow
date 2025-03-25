import React from 'react';
import Layout from '@/components/Layout';
import CampaignsList from '@/components/campaigns/CampaignsList';

const CampaignsPage: React.FC = () => {
  return (
    <Layout title="Campaigns">
      <div className="h-full flex flex-col min-h-[calc(100vh-200px)]">
        <CampaignsList />
      </div>
    </Layout>
  );
};

export default CampaignsPage; 