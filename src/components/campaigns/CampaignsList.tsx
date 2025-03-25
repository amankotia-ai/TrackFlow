import React, { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { 
  Trash2, 
  Edit, 
  Plus,
  Settings,
  SquareStack,
  ArrowLeft
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { slideUp, staggerContainer } from "@/lib/animations";
import { Tables } from "@/integrations/supabase/types";
import { useNavigate, useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

type Campaign = Tables<"campaigns">;
type Page = Tables<"pages">;

interface CampaignsListProps {
  campaigns: Campaign[];
  loading: boolean;
  onCampaignChange: () => void;
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

const CampaignsList: React.FC = () => {
  const { pageId } = useParams<{ pageId: string }>();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState<Page | null>(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [editedCampaign, setEditedCampaign] = useState<Partial<Campaign>>({});
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingCampaignId, setDeletingCampaignId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newCampaign, setNewCampaign] = useState<Partial<Campaign>>({
    name: "",
    type: "custom",
    description: "",
    active: true,
    page_id: pageId
  });

  const fetchCampaigns = async () => {
    if (!pageId) return;
    
    try {
      setLoading(true);
      
      // Fetch the page details
      const { data: pageData, error: pageError } = await supabase
        .from('pages')
        .select('*')
        .eq('id', pageId)
        .single();
        
      if (pageError) throw pageError;
      setPage(pageData);

      // Fetch campaigns for this page
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('page_id', pageId)
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
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [pageId]);

  const toggleCampaignStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('campaigns')
        .update({ active: !currentStatus })
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: `Campaign ${!currentStatus ? 'activated' : 'deactivated'} successfully`,
      });
      
      fetchCampaigns();
    } catch (error) {
      console.error('Error toggling campaign status:', error);
      toast({
        title: "Error",
        description: "Failed to update campaign status",
        variant: "destructive"
      });
    }
  };

  const deleteCampaign = async (id: string) => {
    try {
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Campaign deleted successfully",
      });
      
      fetchCampaigns();
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast({
        title: "Error",
        description: "Failed to delete campaign",
        variant: "destructive"
      });
    }
  };

  const startEditing = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setEditedCampaign({...campaign});
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setEditingCampaign(null);
    setEditedCampaign({});
    setIsEditing(false);
  };

  const saveEditedCampaign = async () => {
    if (!editingCampaign) return;
    
    try {
      const { error } = await supabase
        .from('campaigns')
        .update({
          name: editedCampaign.name,
          type: editedCampaign.type,
          description: editedCampaign.description,
          active: editedCampaign.active,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingCampaign.id);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Campaign updated successfully",
      });
      
      setIsEditing(false);
      setEditingCampaign(null);
      fetchCampaigns();
    } catch (error) {
      console.error('Error updating campaign:', error);
      toast({
        title: "Error",
        description: "Failed to update campaign",
        variant: "destructive"
      });
    }
  };

  const createCampaign = async () => {
    try {
      if (!newCampaign.name || !newCampaign.type) {
        toast({
          title: "Error",
          description: "Name and type are required",
          variant: "destructive"
        });
        return;
      }

      const { data, error } = await supabase
        .from('campaigns')
        .insert({
          name: newCampaign.name,
          type: newCampaign.type,
          description: newCampaign.description,
          page_id: pageId,
          active: true
        })
        .select();
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Campaign created successfully",
      });
      
      setIsCreating(false);
      setNewCampaign({
        name: "",
        type: "custom",
        description: "",
        active: true,
        page_id: pageId
      });
      fetchCampaigns();
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast({
        title: "Error",
        description: "Failed to create campaign",
        variant: "destructive"
      });
    }
  };

  const navigateToContentRules = (campaignId: string) => {
    navigate(`/campaigns/${campaignId}/content-rules`);
  };

  const getCampaignTypeInfo = (type: string) => {
    return CAMPAIGN_TYPES.find(t => t.value === type) || CAMPAIGN_TYPES[CAMPAIGN_TYPES.length - 1]; // Default to custom
  };

  if (loading) {
    return (
      <motion.div 
        variants={slideUp}
        className="text-center py-12"
      >
        Loading campaigns...
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="sm"
          className="mr-4"
          onClick={() => navigate('/pages')}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Pages
        </Button>
        
        <div>
          <h1 className="text-2xl font-semibold">
            {page?.name || 'Page'} Campaigns
          </h1>
          {page?.url && (
            <p className="text-sm text-gray-500">
              {new URL(page.url).hostname}
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-between items-center">
        <p className="text-gray-600">
          Manage your campaigns for this page. Each campaign can have multiple content rules.
        </p>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Campaign
        </Button>
      </div>
      
      {campaigns.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500 mb-6">No campaigns found for this page. Create your first campaign to get started.</p>
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Campaign
          </Button>
        </div>
      ) : (
        <motion.div 
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          <AnimatePresence>
            {campaigns.map((campaign, index) => {
              const typeInfo = getCampaignTypeInfo(campaign.type);
              
              return (
                <motion.div
                  key={campaign.id}
                  variants={slideUp}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  custom={index}
                  transition={{ delay: index * 0.05 }}
                  layout
                >
                  <Card className="group relative overflow-hidden border border-gray-100 rounded-lg h-full bg-[#FAFAFA] hover:shadow-md transition-shadow duration-200">
                    <CardHeader className="p-5 pb-0">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-medium text-gray-800">{campaign.name}</CardTitle>
                        <Switch
                          checked={campaign.active}
                          onCheckedChange={() => toggleCampaignStatus(campaign.id, campaign.active)}
                        />
                      </div>
                      
                      <div className="mt-2">
                        <Badge className={`${typeInfo.color} border-none`}>
                          {typeInfo.label}
                        </Badge>
                      </div>
                      
                      {campaign.description && (
                        <p className="text-sm text-gray-500 mt-2">{campaign.description}</p>
                      )}
                    </CardHeader>
                    
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2 text-xs"
                            onClick={() => startEditing(campaign)}
                          >
                            <Settings className="h-3.5 w-3.5 mr-1" />
                            Settings
                          </Button>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="default"
                            size="sm"
                            className="h-8 px-3"
                            onClick={() => navigateToContentRules(campaign.id)}
                          >
                            <SquareStack className="h-3.5 w-3.5 mr-1.5" />
                            Content Rules
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Edit Campaign Dialog */}
      <Dialog open={isEditing} onOpenChange={(open) => !open && cancelEditing()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Campaign</DialogTitle>
            <DialogDescription>
              Make changes to the campaign settings.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Campaign Name</Label>
              <Input 
                id="edit-name" 
                value={editedCampaign.name || ""} 
                onChange={(e) => setEditedCampaign({...editedCampaign, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-type">Campaign Type</Label>
              <Select 
                value={editedCampaign.type || "custom"} 
                onValueChange={(value) => setEditedCampaign({...editedCampaign, type: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select campaign type" />
                </SelectTrigger>
                <SelectContent>
                  {CAMPAIGN_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description (Optional)</Label>
              <Textarea 
                id="edit-description" 
                value={editedCampaign.description || ""} 
                onChange={(e) => setEditedCampaign({...editedCampaign, description: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter className="flex justify-between">
            <Button
              variant="outline"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => {
                setDeletingCampaignId(editingCampaign?.id || null);
                setIsDeleting(true);
                setIsEditing(false);
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Campaign
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={cancelEditing}>Cancel</Button>
              <Button onClick={saveEditedCampaign}>Save Changes</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleting} onOpenChange={setIsDeleting}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Campaign</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this campaign? This will also delete all content rules associated with it.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleting(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deletingCampaignId) {
                  deleteCampaign(deletingCampaignId);
                  setIsDeleting(false);
                }
              }}
            >
              Delete Campaign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Campaign Dialog */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Campaign</DialogTitle>
            <DialogDescription>
              Add a new campaign to manage content rules for.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Campaign Name</Label>
              <Input 
                id="name" 
                value={newCampaign.name || ""} 
                onChange={(e) => setNewCampaign({...newCampaign, name: e.target.value})}
                placeholder="Facebook Ads - Spring 2024"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Campaign Type</Label>
              <Select 
                value={newCampaign.type || "custom"} 
                onValueChange={(value) => setNewCampaign({...newCampaign, type: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select campaign type" />
                </SelectTrigger>
                <SelectContent>
                  {CAMPAIGN_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea 
                id="description" 
                value={newCampaign.description || ""} 
                onChange={(e) => setNewCampaign({...newCampaign, description: e.target.value})}
                placeholder="Spring promotion targeting new customers"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreating(false)}>Cancel</Button>
            <Button onClick={createCampaign}>Create Campaign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CampaignsList; 