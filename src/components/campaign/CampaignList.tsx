import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash, Star, Calendar } from "lucide-react";
import { fadeIn, cardHover } from "@/lib/animations";
import { format } from "date-fns";

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

interface CampaignListProps {
  campaigns: Campaign[];
  loading: boolean;
  onCampaignChange: () => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'scheduled':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'completed':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'paused':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const CampaignList: React.FC<CampaignListProps> = ({ campaigns, loading, onCampaignChange }) => {
  if (campaigns.length === 0 && !loading) {
    return (
      <div className="text-center py-12 px-4">
        <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns yet</h3>
        <p className="text-gray-600 mb-8">Create your first campaign to start tracking your marketing efforts.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5">
      {campaigns.map((campaign) => (
        <motion.div
          key={campaign.id}
          variants={fadeIn}
          whileHover="hover"
          initial="rest"
          animate="rest"
        >
          <motion.div variants={cardHover}>
            <Card className="border border-gray-200 rounded-lg overflow-hidden h-full">
              <CardContent className="p-0">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900 truncate">{campaign.name}</h3>
                    <Badge className={getStatusColor(campaign.status)}>
                      {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                    </Badge>
                  </div>
                  
                  {campaign.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{campaign.description}</p>
                  )}
                  
                  {(campaign.start_date || campaign.end_date) && (
                    <div className="flex items-center text-gray-600 text-sm mb-4">
                      <Calendar className="h-4 w-4 mr-2" />
                      {campaign.start_date && campaign.end_date ? (
                        <>
                          {format(new Date(campaign.start_date), 'MMM d, yyyy')} - {format(new Date(campaign.end_date), 'MMM d, yyyy')}
                        </>
                      ) : campaign.start_date ? (
                        <>From {format(new Date(campaign.start_date), 'MMM d, yyyy')}</>
                      ) : (
                        <>Until {format(new Date(campaign.end_date!), 'MMM d, yyyy')}</>
                      )}
                    </div>
                  )}
                  
                  {campaign.budget && (
                    <div className="text-gray-800 font-medium">
                      Budget: ${campaign.budget.toLocaleString()}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
                    <div className="text-gray-500 text-sm">
                      Created {format(new Date(campaign.created_at), 'MMM d, yyyy')}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Star className="h-4 w-4 text-gray-500" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Edit className="h-4 w-4 text-gray-500" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Trash className="h-4 w-4 text-gray-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      ))}
    </div>
  );
};

export default CampaignList; 