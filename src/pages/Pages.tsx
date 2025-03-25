import React, { useState } from 'react';
import Layout from '@/components/Layout';
import PagesDashboard from '@/components/pages/PagesDashboard';
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Pages: React.FC = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [newPage, setNewPage] = useState<{
    name: string;
    url: string;
    description: string | null;
    active: boolean;
  }>({
    name: "",
    url: "",
    description: "",
    active: true
  });
  const { toast } = useToast();

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
      // Refresh the page list in PagesDashboard
      window.location.reload();
    } catch (error) {
      console.error('Error creating page:', error);
      toast({
        title: "Error",
        description: "Failed to create page",
        variant: "destructive"
      });
    }
  };

  const actionButtons = (
    <Button 
      variant="default" 
      size="sm" 
      className="bg-gray-900 text-white hover:bg-gray-800"
      onClick={() => setIsCreating(true)}
    >
      <Plus className="h-4 w-4 mr-2" />
      Add New Page
    </Button>
  );

  return (
    <Layout 
      title="Pages"
      actionButtons={actionButtons}
    >
      <div className="h-full flex flex-col flex-1 min-h-[calc(100vh-200px)]">
        <PagesDashboard />
      </div>

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
    </Layout>
  );
};

export default Pages; 