
import React, { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { 
  Trash2, 
  Copy, 
  Edit, 
  Check, 
  X 
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ContentRule {
  id: string;
  name: string;
  description: string | null;
  selector: string;
  condition_type: string;
  condition_value: string;
  replacement_content: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

interface RulesListProps {
  rules: ContentRule[];
  loading: boolean;
  onRuleChange: () => void;
}

const RulesList: React.FC<RulesListProps> = ({ rules, loading, onRuleChange }) => {
  const { toast } = useToast();
  const [editingRule, setEditingRule] = useState<ContentRule | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedRule, setEditedRule] = useState<Partial<ContentRule>>({});

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Text copied to clipboard",
    });
  };

  const toggleRuleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('content_rules')
        .update({ active: !currentStatus })
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: `Rule ${!currentStatus ? 'activated' : 'deactivated'} successfully`,
      });
      
      onRuleChange();
    } catch (error) {
      console.error('Error toggling rule status:', error);
      toast({
        title: "Error",
        description: "Failed to update rule status",
        variant: "destructive"
      });
    }
  };

  const deleteRule = async (id: string) => {
    try {
      const { error } = await supabase
        .from('content_rules')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Content rule deleted successfully",
      });
      
      onRuleChange();
    } catch (error) {
      console.error('Error deleting rule:', error);
      toast({
        title: "Error",
        description: "Failed to delete content rule",
        variant: "destructive"
      });
    }
  };

  const startEditing = (rule: ContentRule) => {
    setEditingRule(rule);
    setEditedRule({...rule});
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setEditingRule(null);
    setEditedRule({});
    setIsEditing(false);
  };

  const saveEditedRule = async () => {
    if (!editingRule) return;
    
    try {
      const { error } = await supabase
        .from('content_rules')
        .update({
          name: editedRule.name,
          description: editedRule.description,
          selector: editedRule.selector,
          condition_type: editedRule.condition_type,
          condition_value: editedRule.condition_value,
          replacement_content: editedRule.replacement_content,
          active: editedRule.active,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingRule.id);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Content rule updated successfully",
      });
      
      setIsEditing(false);
      setEditingRule(null);
      onRuleChange();
    } catch (error) {
      console.error('Error updating rule:', error);
      toast({
        title: "Error",
        description: "Failed to update content rule",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading rules...</div>;
  }

  if (rules.length === 0) {
    return (
      <div className="text-center py-8 border rounded-lg bg-muted/50">
        <p className="text-lg mb-2">No content rules found</p>
        <p className="text-sm text-muted-foreground">Create your first rule to start personalizing content based on UTM parameters</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {rules.map(rule => (
        <Card key={rule.id}>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {rule.name}
                  {rule.active ? (
                    <Badge variant="default" className="ml-2">Active</Badge>
                  ) : (
                    <Badge variant="outline" className="ml-2">Inactive</Badge>
                  )}
                </CardTitle>
                {rule.description && (
                  <CardDescription className="mt-1">{rule.description}</CardDescription>
                )}
              </div>
              <div className="flex gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => startEditing(rule)}
                  title="Edit Rule"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => toggleRuleStatus(rule.id, rule.active)}
                  title={rule.active ? "Deactivate Rule" : "Activate Rule"}
                >
                  <Switch checked={rule.active} />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => deleteRule(rule.id)}
                  title="Delete Rule"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-2">
              <div>
                <p className="text-sm font-medium mb-1">CSS Selector</p>
                <code className="text-xs bg-muted p-1 rounded">{rule.selector}</code>
              </div>
              
              <div>
                <p className="text-sm font-medium mb-1">Condition</p>
                <div className="flex items-center gap-1">
                  <Badge variant="outline" className="font-mono text-xs">
                    {rule.condition_type}
                  </Badge>
                  <span>=</span>
                  <Badge variant="secondary" className="font-mono text-xs">
                    {rule.condition_value}
                  </Badge>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium mb-1">Created</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(rule.created_at).toLocaleString()}
                </p>
              </div>
            </div>
            
            <Separator className="my-3" />
            
            <div>
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium mb-1">Replacement HTML</p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 px-2"
                  onClick={() => copyToClipboard(rule.replacement_content)}
                >
                  <Copy className="h-3 w-3 mr-1" /> Copy
                </Button>
              </div>
              <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
                {rule.replacement_content}
              </pre>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Edit Rule Dialog */}
      <Dialog open={isEditing} onOpenChange={(open) => !open && cancelEditing()}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Content Rule</DialogTitle>
            <DialogDescription>
              Update the details of your content rule.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Rule Name</Label>
                <Input 
                  id="edit-name" 
                  value={editedRule.name || ''} 
                  onChange={(e) => setEditedRule({...editedRule, name: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description (Optional)</Label>
                <Textarea 
                  id="edit-description" 
                  value={editedRule.description || ''} 
                  onChange={(e) => setEditedRule({...editedRule, description: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-selector">CSS Selector</Label>
                <Input 
                  id="edit-selector" 
                  value={editedRule.selector || ''} 
                  onChange={(e) => setEditedRule({...editedRule, selector: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-condition-type">Condition Type</Label>
                  <Select 
                    value={editedRule.condition_type || ''} 
                    onValueChange={(value) => setEditedRule({...editedRule, condition_type: value})}
                  >
                    <SelectTrigger>
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
                  <Label htmlFor="edit-condition-value">Condition Value</Label>
                  <Input 
                    id="edit-condition-value" 
                    value={editedRule.condition_value || ''} 
                    onChange={(e) => setEditedRule({...editedRule, condition_value: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-replacement-content">Replacement HTML</Label>
                <Textarea 
                  id="edit-replacement-content" 
                  value={editedRule.replacement_content || ''} 
                  onChange={(e) => setEditedRule({...editedRule, replacement_content: e.target.value})}
                  className="font-mono"
                  rows={4}
                />
              </div>
              
              <div className="flex items-center space-x-2 pt-2">
                <Switch 
                  id="edit-active" 
                  checked={editedRule.active || false} 
                  onCheckedChange={(checked) => setEditedRule({...editedRule, active: checked})} 
                />
                <Label htmlFor="edit-active">Rule Active</Label>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={cancelEditing}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={saveEditedRule}>
              <Check className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RulesList;
