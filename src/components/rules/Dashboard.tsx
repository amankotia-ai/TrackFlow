
import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RulesList from "./RulesList";
import CreateRuleForm from "./CreateRuleForm";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

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

const Dashboard: React.FC = () => {
  const [rules, setRules] = useState<ContentRule[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("view");

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('content_rules')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setRules(data || []);
    } catch (error) {
      console.error('Error fetching rules:', error);
      toast({
        title: "Error",
        description: "Failed to fetch content rules",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRuleCreated = () => {
    fetchRules();
    setActiveTab("view");
  };

  return (
    <div>
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="view">View Rules</TabsTrigger>
          <TabsTrigger value="create">Create Rule</TabsTrigger>
        </TabsList>

        <TabsContent value="view">
          <RulesList 
            rules={rules} 
            loading={loading} 
            onRuleChange={fetchRules} 
          />
        </TabsContent>
        
        <TabsContent value="create">
          <CreateRuleForm onRuleCreated={handleRuleCreated} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
