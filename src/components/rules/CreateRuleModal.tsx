import React, { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CreateRuleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRuleCreated: () => void;
  campaignId?: string;
}

const CreateRuleModal: React.FC<CreateRuleModalProps> = ({
  open,
  onOpenChange,
  onRuleCreated,
  campaignId
}) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newRule, setNewRule] = useState({
    name: "",
    description: "",
    selector: "",
    condition_type: "utm_source",
    condition_value: "",
    replacement_content: "",
    active: true,
    campaign_id: campaignId
  });

  useEffect(() => {
    setNewRule(prev => ({ ...prev, campaign_id: campaignId }));
  }, [campaignId]);

  const resetForm = () => {
    setNewRule({
      name: "",
      description: "",
      selector: "",
      condition_type: "utm_source",
      condition_value: "",
      replacement_content: "",
      active: true,
      campaign_id: campaignId
    });
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const createRule = async () => {
    try {
      setIsSubmitting(true);
      
      // Validate form
      if (!newRule.name || !newRule.selector || !newRule.condition_value) {
        toast({
          title: "Validation Error",
          description: "Please fill all required fields",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }
      
      // Create rule in database
      const { data, error } = await supabase
        .from('content_rules')
        .insert([newRule])
        .select();
      
      if (error) throw error;
      
      // Show success message
      toast({
        title: "Success",
        description: "Content rule created successfully",
      });
      
      // Reset form and close modal
      resetForm();
      onOpenChange(false);
      onRuleCreated();
    } catch (error) {
      console.error('Error creating rule:', error);
      toast({
        title: "Error",
        description: "Failed to create content rule",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-full md:max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        <div className="p-6">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-xl">Create New Rule</DialogTitle>
            <DialogDescription>
              Define how content should change based on UTM parameters
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Rule Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={newRule.name}
                onChange={(e) => setNewRule({...newRule, name: e.target.value})}
                placeholder="Homepage Header Rule"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">Description (Optional)</Label>
              <Textarea
                id="description"
                value={newRule.description}
                onChange={(e) => setNewRule({...newRule, description: e.target.value})}
                placeholder="Changes the homepage header content for visitors from specific campaigns"
                rows={2}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="selector" className="text-sm font-medium">
                CSS Selector <span className="text-red-500">*</span>
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="selector"
                  value={newRule.selector}
                  onChange={(e) => setNewRule({...newRule, selector: e.target.value})}
                  placeholder="#homepage-header h1"
                  className="font-mono text-sm"
                />
              </div>
              <p className="text-xs text-gray-500">
                The CSS selector for the element(s) you want to modify
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="condition_type" className="text-sm font-medium">
                  Condition Type <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={newRule.condition_type}
                  onValueChange={(value) => setNewRule({...newRule, condition_type: value})}
                >
                  <SelectTrigger id="condition_type" className="w-full">
                    <SelectValue placeholder="Select condition type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="utm_source">utm_source</SelectItem>
                    <SelectItem value="utm_medium">utm_medium</SelectItem>
                    <SelectItem value="utm_campaign">utm_campaign</SelectItem>
                    <SelectItem value="utm_term">utm_term</SelectItem>
                    <SelectItem value="utm_content">utm_content</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="condition_value" className="text-sm font-medium">
                  Condition Value <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="condition_value"
                  value={newRule.condition_value}
                  onChange={(e) => setNewRule({...newRule, condition_value: e.target.value})}
                  placeholder="google"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="replacement_content" className="text-sm font-medium">
                Replacement Content <span className="text-red-500">*</span>
              </Label>
              <div className="max-h-[300px] overflow-y-auto border rounded-md p-1">
                <RichTextEditor
                  value={newRule.replacement_content}
                  onChange={(value) => setNewRule({...newRule, replacement_content: value})}
                  placeholder="Add your formatted content here"
                />
              </div>
              <p className="text-xs text-gray-500">
                HTML content that will replace the selected element(s). Select text to format.
              </p>
            </div>
            
            <div className="flex items-center space-x-2 pt-4">
              <Switch
                id="active"
                checked={newRule.active}
                onCheckedChange={(checked) => setNewRule({...newRule, active: checked})}
              />
              <Label htmlFor="active" className="text-sm font-medium">Rule Active</Label>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-end gap-2 mt-6 pt-4 border-t border-gray-100">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="sm:order-1"
            >
              Cancel
            </Button>
            <Button
              onClick={createRule}
              disabled={isSubmitting}
              className="bg-gray-900 text-white hover:bg-gray-800 sm:order-2"
            >
              {isSubmitting ? "Creating..." : "Create Rule"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateRuleModal; 