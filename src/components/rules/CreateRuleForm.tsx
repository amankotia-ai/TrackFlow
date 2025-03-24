
import React, { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { PlusCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface CreateRuleFormProps {
  onRuleCreated: () => void;
}

const CreateRuleForm: React.FC<CreateRuleFormProps> = ({ onRuleCreated }) => {
  const { toast } = useToast();
  const [newRule, setNewRule] = useState({
    name: "",
    description: "",
    selector: "",
    condition_type: "utm_source",
    condition_value: "",
    replacement_content: "",
    active: true
  });

  const createRule = async () => {
    try {
      if (!newRule.name || !newRule.selector || !newRule.condition_value || !newRule.replacement_content) {
        toast({
          title: "Validation Error",
          description: "Please fill all required fields",
          variant: "destructive"
        });
        return;
      }
      
      const { data, error } = await supabase
        .from('content_rules')
        .insert([newRule])
        .select();
      
      if (error) throw error;
      
      setNewRule({
        name: "",
        description: "",
        selector: "",
        condition_type: "utm_source",
        condition_value: "",
        replacement_content: "",
        active: true
      });
      
      toast({
        title: "Success",
        description: "Content rule created successfully",
      });
      
      onRuleCreated();
    } catch (error) {
      console.error('Error creating rule:', error);
      toast({
        title: "Error",
        description: "Failed to create content rule",
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Rule</CardTitle>
        <CardDescription>Define how content should change based on UTM parameters</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Rule Name</Label>
          <Input 
            id="name" 
            value={newRule.name} 
            onChange={(e) => setNewRule({...newRule, name: e.target.value})}
            placeholder="Homepage Hero for Google Ads"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="description">Description (Optional)</Label>
          <Textarea 
            id="description" 
            value={newRule.description} 
            onChange={(e) => setNewRule({...newRule, description: e.target.value})}
            placeholder="Change the homepage hero headline for visitors from Google Ads"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="selector">CSS Selector</Label>
          <Input 
            id="selector" 
            value={newRule.selector} 
            onChange={(e) => setNewRule({...newRule, selector: e.target.value})}
            placeholder=".hero h1"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="condition_type">Condition Type</Label>
            <Select 
              value={newRule.condition_type} 
              onValueChange={(value) => setNewRule({...newRule, condition_type: value})}
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
            <Label htmlFor="condition_value">Condition Value</Label>
            <Input 
              id="condition_value" 
              value={newRule.condition_value} 
              onChange={(e) => setNewRule({...newRule, condition_value: e.target.value})}
              placeholder="google"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="replacement_content">Replacement HTML</Label>
          <Textarea 
            id="replacement_content" 
            value={newRule.replacement_content} 
            onChange={(e) => setNewRule({...newRule, replacement_content: e.target.value})}
            placeholder="<span>Special Offer for Google Visitors!</span>"
            className="font-mono"
            rows={4}
          />
        </div>
        
        <div className="flex items-center space-x-2 pt-2">
          <Switch 
            id="active" 
            checked={newRule.active} 
            onCheckedChange={(checked) => setNewRule({...newRule, active: checked})} 
          />
          <Label htmlFor="active">Rule Active</Label>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={createRule} className="w-full">
          <PlusCircle className="h-4 w-4 mr-2" />
          Create Rule
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CreateRuleForm;
