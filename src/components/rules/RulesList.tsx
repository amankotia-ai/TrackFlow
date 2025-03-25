import React, { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { 
  Trash2, 
  Copy, 
  Edit, 
  Check, 
  X,
  Plus,
  AlertTriangle
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
import { motion, AnimatePresence } from "framer-motion";
import { cardHover, slideUp, staggerContainer } from "@/lib/animations";
import { RichTextEditor } from "@/components/ui/rich-text-editor";

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

interface SelectorReplacement {
  selector: string;
  replacement: string;
}

interface RulesListProps {
  rules: ContentRule[];
  loading: boolean;
  onRuleChange: () => void;
}

const RulesList: React.FC<RulesListProps> = ({ rules, loading, onRuleChange }) => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editingRule, setEditingRule] = useState<ContentRule | null>(null);
  const [editedRule, setEditedRule] = useState<Partial<ContentRule>>({});
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingRuleId, setDeletingRuleId] = useState<string | null>(null);
  const [useMultipleSelectors, setUseMultipleSelectors] = useState(false);
  const [selectorReplacements, setSelectorReplacements] = useState<SelectorReplacement[]>([
    { selector: "", replacement: "" }
  ]);

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
    
    // No more JSON parsing needed
    setSelectorReplacements([{ selector: rule.selector, replacement: rule.replacement_content }]);
    setUseMultipleSelectors(false);
  };

  const cancelEditing = () => {
    setEditingRule(null);
    setEditedRule({});
    setIsEditing(false);
    setSelectorReplacements([{ selector: "", replacement: "" }]);
    setUseMultipleSelectors(false);
  };

  const addSelectorReplacement = () => {
    setSelectorReplacements([...selectorReplacements, { selector: "", replacement: "" }]);
  };

  const removeSelectorReplacement = (index: number) => {
    const updatedSelectors = [...selectorReplacements];
    updatedSelectors.splice(index, 1);
    setSelectorReplacements(updatedSelectors);
  };

  const updateSelectorReplacement = (index: number, field: keyof SelectorReplacement, value: string) => {
    const updatedSelectors = [...selectorReplacements];
    updatedSelectors[index][field] = value;
    setSelectorReplacements(updatedSelectors);
  };

  const saveEditedRule = async () => {
    if (!editingRule) return;
    
    try {
      let ruleToSave = { ...editedRule };
      
      if (useMultipleSelectors) {
        // This shouldn't happen anymore, but just in case
        toast({
          title: "Error",
          description: "Multiple selectors are now created as separate rules. Please edit each rule individually.",
          variant: "destructive"
        });
        return;
      }
      
      const { error } = await supabase
        .from('content_rules')
        .update({
          name: ruleToSave.name,
          description: ruleToSave.description,
          selector: ruleToSave.selector,
          condition_type: ruleToSave.condition_type,
          condition_value: ruleToSave.condition_value,
          replacement_content: ruleToSave.replacement_content,
          active: ruleToSave.active,
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
      setUseMultipleSelectors(false);
      setSelectorReplacements([{ selector: "", replacement: "" }]);
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

  if (rules.length === 0) {
    return (
      <motion.div 
        variants={slideUp}
        className="text-left py-12 text-gray-600"
      >
        No items found
      </motion.div>
    );
  }

  return (
    <motion.div 
      variants={staggerContainer}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5"
    >
      <AnimatePresence>
        {rules.map((rule, index) => (
          <motion.div
            key={rule.id}
            variants={slideUp}
            initial="hidden"
            animate="visible"
            exit="exit"
            custom={index}
            transition={{ delay: index * 0.05 }}
            layout
          >
            <Card className="group relative overflow-hidden border border-gray-100 rounded-lg h-full bg-[#FAFAFA]">
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-800">{rule.name}</h3>
                  <Switch
                    checked={rule.active}
                    onCheckedChange={() => toggleRuleStatus(rule.id, rule.active)}
                  />
                </div>
                
                {rule.description && (
                  <p className="text-sm text-gray-500 mb-4">{rule.description}</p>
                )}

                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="bg-white">{rule.condition_type}</Badge>
                    <span className="text-gray-400">=</span>
                    <Badge className="bg-gray-800 text-white">{rule.condition_value}</Badge>
                  </div>
                  
                  <div>
                    <Label className="text-xs text-gray-400 mb-1 block">CSS Selector</Label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-white border border-gray-200 p-2 rounded text-xs font-mono text-gray-600 overflow-hidden text-ellipsis">
                        {rule.selector}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => copyToClipboard(rule.selector)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                  <div className="text-xs text-gray-400">
                    {new Date(rule.created_at).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2"
                      onClick={() => startEditing(rule)}
                    >
                      <Edit className="h-3.5 w-3.5 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => {
                        setDeletingRuleId(rule.id);
                        setIsDeleting(true);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleting} onOpenChange={setIsDeleting}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Rule</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this rule? This action cannot be undone.
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
                if (deletingRuleId) {
                  deleteRule(deletingRuleId);
                  setIsDeleting(false);
                }
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Rule Dialog */}
      <Dialog open={isEditing} onOpenChange={(open) => !open && cancelEditing()}>
        <DialogContent className="max-w-[95vw] w-full md:max-w-2xl max-h-[90vh] overflow-y-auto p-0">
          <div className="p-6">
            <DialogHeader className="pb-4">
              <DialogTitle className="text-xl">Edit Rule</DialogTitle>
              <DialogDescription>
                Make changes to your content rule here.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">Rule Name</Label>
                <Input
                  id="name"
                  value={editedRule.name || ""}
                  onChange={(e) => setEditedRule({ ...editedRule, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                <Textarea
                  id="description"
                  value={editedRule.description || ""}
                  onChange={(e) => setEditedRule({ ...editedRule, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="selector" className="text-sm font-medium">CSS Selector</Label>
                <Input
                  id="selector"
                  value={editedRule.selector || ""}
                  onChange={(e) => setEditedRule({ ...editedRule, selector: e.target.value })}
                  className="font-mono text-sm"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="condition_type" className="text-sm font-medium">Condition Type</Label>
                  <Select
                    value={editedRule.condition_type}
                    onValueChange={(value) => setEditedRule({ ...editedRule, condition_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
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
                  <Label htmlFor="condition_value" className="text-sm font-medium">Condition Value</Label>
                  <Input
                    id="condition_value"
                    value={editedRule.condition_value || ""}
                    onChange={(e) => setEditedRule({ ...editedRule, condition_value: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="replacement_content" className="text-sm font-medium">Replacement Content</Label>
                <div className="max-h-[300px] overflow-y-auto border rounded-md p-1">
                  <RichTextEditor
                    value={editedRule.replacement_content || ""}
                    onChange={(value) => setEditedRule({ ...editedRule, replacement_content: value })}
                    placeholder="Add your formatted content here"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  HTML content that will replace the selected element(s). Select text to format.
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={editedRule.active}
                  onCheckedChange={(checked) => setEditedRule({ ...editedRule, active: checked })}
                />
                <Label htmlFor="active" className="text-sm font-medium">Rule Active</Label>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-end gap-2 mt-6 pt-4 border-t border-gray-100">
              <Button variant="outline" onClick={cancelEditing} className="sm:order-1">
                Cancel
              </Button>
              <Button onClick={saveEditedRule} className="bg-gray-900 text-white hover:bg-gray-800 sm:order-2">
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default RulesList;
