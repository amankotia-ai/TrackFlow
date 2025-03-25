import React, { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { 
  Trash2, 
  Edit, 
  Plus,
  Globe,
  ExternalLink,
  Settings,
  Layers
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
import { motion, AnimatePresence } from "framer-motion";
import { slideUp, staggerContainer } from "@/lib/animations";
import { Tables } from "@/integrations/supabase/types";
import { useNavigate } from "react-router-dom";

type Page = Tables<"pages">;

interface PagesListProps {
  pages: Page[];
  loading: boolean;
  onPageChange: () => void;
}

const PagesList: React.FC<PagesListProps> = ({ pages, loading, onPageChange }) => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editingPage, setEditingPage] = useState<Page | null>(null);
  const [editedPage, setEditedPage] = useState<Partial<Page>>({});
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingPageId, setDeletingPageId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newPage, setNewPage] = useState<Partial<Page>>({
    name: "",
    url: "",
    description: "",
    active: true
  });
  const navigate = useNavigate();

  const togglePageStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('pages')
        .update({ active: !currentStatus })
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: `Page ${!currentStatus ? 'activated' : 'deactivated'} successfully`,
      });
      
      onPageChange();
    } catch (error) {
      console.error('Error toggling page status:', error);
      toast({
        title: "Error",
        description: "Failed to update page status",
        variant: "destructive"
      });
    }
  };

  const deletePage = async (id: string) => {
    try {
      const { error } = await supabase
        .from('pages')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Page deleted successfully",
      });
      
      onPageChange();
    } catch (error) {
      console.error('Error deleting page:', error);
      toast({
        title: "Error",
        description: "Failed to delete page",
        variant: "destructive"
      });
    }
  };

  const startEditing = (page: Page) => {
    setEditingPage(page);
    setEditedPage({...page});
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setEditingPage(null);
    setEditedPage({});
    setIsEditing(false);
  };

  const saveEditedPage = async () => {
    if (!editingPage) return;
    
    try {
      const { error } = await supabase
        .from('pages')
        .update({
          name: editedPage.name,
          url: editedPage.url,
          description: editedPage.description,
          active: editedPage.active,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingPage.id);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Page updated successfully",
      });
      
      setIsEditing(false);
      setEditingPage(null);
      onPageChange();
    } catch (error) {
      console.error('Error updating page:', error);
      toast({
        title: "Error",
        description: "Failed to update page",
        variant: "destructive"
      });
    }
  };

  const createPage = async () => {
    try {
      if (!newPage.name || !newPage.url) {
        toast({
          title: "Error",
          description: "Name and URL are required",
          variant: "destructive"
        });
        return;
      }

      const { data, error } = await supabase
        .from('pages')
        .insert({
          name: newPage.name,
          url: newPage.url,
          description: newPage.description,
          active: true
        })
        .select();
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Page created successfully",
      });
      
      setIsCreating(false);
      setNewPage({
        name: "",
        url: "",
        description: "",
        active: true
      });
      onPageChange();
    } catch (error) {
      console.error('Error creating page:', error);
      toast({
        title: "Error",
        description: "Failed to create page",
        variant: "destructive"
      });
    }
  };

  const navigateToCampaigns = (pageId: string) => {
    navigate(`/campaigns/${pageId}`);
  };

  if (loading) {
    return (
      <motion.div 
        variants={slideUp}
        className="text-center py-12"
      >
        Loading pages...
      </motion.div>
    );
  }

  if (pages.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-6">No pages found. Create your first page to get started.</p>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create New Page
        </Button>
        
        {/* Create Page Dialog */}
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Page</DialogTitle>
              <DialogDescription>
                Add a new page to manage content rules for.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Page Name</Label>
                <Input 
                  id="name" 
                  value={newPage.name || ""} 
                  onChange={(e) => setNewPage({...newPage, name: e.target.value})}
                  placeholder="Home Page"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="url">Page URL</Label>
                <Input 
                  id="url" 
                  value={newPage.url || ""} 
                  onChange={(e) => setNewPage({...newPage, url: e.target.value})}
                  placeholder="https://example.com/home"
                />
                <p className="text-xs text-gray-500">Enter the full URL of the page</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea 
                  id="description" 
                  value={newPage.description || ""} 
                  onChange={(e) => setNewPage({...newPage, description: e.target.value})}
                  placeholder="Main homepage with hero section and features"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreating(false)}>Cancel</Button>
              <Button onClick={createPage}>Create Page</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div 
        variants={staggerContainer}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
      >
        <AnimatePresence>
          {pages.map((page, index) => (
            <motion.div
              key={page.id}
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
                    <CardTitle className="text-lg font-medium text-gray-800">{page.name}</CardTitle>
                    <Switch
                      checked={page.active}
                      onCheckedChange={() => togglePageStatus(page.id, page.active)}
                    />
                  </div>
                  
                  {page.description && (
                    <p className="text-sm text-gray-500 mt-2">{page.description}</p>
                  )}
                </CardHeader>
                
                <CardContent className="p-5">
                  <div className="space-y-4">
                    <div className="flex items-center text-sm text-gray-500">
                      <Globe className="h-4 w-4 mr-2 text-gray-400" />
                      <a 
                        href={page.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline flex items-center"
                      >
                        {new URL(page.url).hostname}
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    </div>
                    
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-2 text-xs"
                          onClick={() => startEditing(page)}
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
                          onClick={() => navigateToCampaigns(page.id)}
                        >
                          <Layers className="h-3.5 w-3.5 mr-1.5" />
                          Campaigns
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Edit Page Dialog */}
      <Dialog open={isEditing} onOpenChange={(open) => !open && cancelEditing()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Page</DialogTitle>
            <DialogDescription>
              Make changes to the page settings.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Page Name</Label>
              <Input 
                id="edit-name" 
                value={editedPage.name || ""} 
                onChange={(e) => setEditedPage({...editedPage, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-url">Page URL</Label>
              <Input 
                id="edit-url" 
                value={editedPage.url || ""} 
                onChange={(e) => setEditedPage({...editedPage, url: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea 
                id="edit-description" 
                value={editedPage.description || ""} 
                onChange={(e) => setEditedPage({...editedPage, description: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter className="flex justify-between">
            <Button
              variant="outline"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => {
                setDeletingPageId(editingPage?.id || null);
                setIsDeleting(true);
                setIsEditing(false);
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Page
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={cancelEditing}>Cancel</Button>
              <Button onClick={saveEditedPage}>Save Changes</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleting} onOpenChange={setIsDeleting}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Page</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this page? This will also delete all campaigns and content rules associated with this page.
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
                if (deletingPageId) {
                  deletePage(deletingPageId);
                  setIsDeleting(false);
                }
              }}
            >
              Delete Page
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Page Dialog */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Page</DialogTitle>
            <DialogDescription>
              Add a new page to manage content rules for.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Page Name</Label>
              <Input 
                id="name" 
                value={newPage.name || ""} 
                onChange={(e) => setNewPage({...newPage, name: e.target.value})}
                placeholder="Home Page"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="url">Page URL</Label>
              <Input 
                id="url" 
                value={newPage.url || ""} 
                onChange={(e) => setNewPage({...newPage, url: e.target.value})}
                placeholder="https://example.com/home"
              />
              <p className="text-xs text-gray-500">Enter the full URL of the page</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea 
                id="description" 
                value={newPage.description || ""} 
                onChange={(e) => setNewPage({...newPage, description: e.target.value})}
                placeholder="Main homepage with hero section and features"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreating(false)}>Cancel</Button>
            <Button onClick={createPage}>Create Page</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PagesList; 