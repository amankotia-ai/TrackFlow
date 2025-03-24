import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import AuthRequired from "@/components/AuthRequired";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Trash2, Copy, ExternalLink, FileCode, Code, LogOut, User } from "lucide-react";

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

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const [rules, setRules] = useState<ContentRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [scriptUrl, setScriptUrl] = useState<string>("");
  const [isUploadingScript, setIsUploadingScript] = useState(false);
  
  const [newRule, setNewRule] = useState<Omit<ContentRule, 'id' | 'created_at' | 'updated_at'>>({
    name: "",
    description: "",
    selector: "",
    condition_type: "utm_source",
    condition_value: "",
    replacement_content: "",
    active: true
  });

  useEffect(() => {
    if (user) {
      fetchRules();
      checkScriptExists();
    }
  }, [user]);

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

  const checkScriptExists = async () => {
    try {
      const { data, error } = await supabase
        .storage
        .from('scripts')
        .list();
      
      if (error) throw error;
      
      const scriptFile = data.find(file => file.name === 'utm-magic.js');
      if (scriptFile) {
        const { data: urlData } = await supabase
          .storage
          .from('scripts')
          .getPublicUrl('utm-magic.js');
        
        setScriptUrl(urlData.publicUrl);
      }
    } catch (error) {
      console.error('Error checking script:', error);
    }
  };

  const uploadScript = async () => {
    try {
      setIsUploadingScript(true);
      
      const scriptContent = generateScriptContent();
      
      const { error } = await supabase
        .storage
        .from('scripts')
        .upload('utm-magic.js', new Blob([scriptContent], { type: 'application/javascript' }), {
          cacheControl: '3600',
          upsert: true
        });
      
      if (error) throw error;
      
      const { data: urlData } = await supabase
        .storage
        .from('scripts')
        .getPublicUrl('utm-magic.js');
      
      setScriptUrl(urlData.publicUrl);
      
      toast({
        title: "Success",
        description: "Script uploaded successfully",
      });
    } catch (error: any) {
      console.error('Error uploading script:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to upload script",
        variant: "destructive"
      });
    } finally {
      setIsUploadingScript(false);
    }
  };

  const generateScriptContent = () => {
    const url = new URL(supabase.supabaseUrl);
    const projectId = url.hostname.split('.')[0];
    
    return `
// UTM Content Magic Script (v1.0)
(function() {
  const PROJECT_ID = "${projectId}";
  
  const getUrlParams = () => {
    const params = {};
    window.location.search.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(_, key, value) {
      params[key] = decodeURIComponent(value);
    });
    return params;
  };
  
  const applyContentRules = (rules) => {
    if (!rules || !rules.length) return;
    
    console.log('UTM Content Magic: Applying rules:', rules);
    
    rules.forEach(rule => {
      try {
        const elements = document.querySelectorAll(rule.selector);
        if (!elements.length) {
          console.log(\`UTM Content Magic: No elements found for selector "\${rule.selector}"\`);
          return;
        }
        
        elements.forEach(element => {
          element.innerHTML = rule.replacement_content;
          console.log(\`UTM Content Magic: Replaced content for \${rule.selector}\`);
        });
      } catch (error) {
        console.error(\`UTM Content Magic: Error applying rule for selector "\${rule.selector}":\`, error);
      }
    });
  };
  
  const init = async () => {
    try {
      const params = getUrlParams();
      const hasUtmParams = Object.keys(params).some(key => key.startsWith('utm_'));
      
      if (!hasUtmParams) {
        console.log('UTM Content Magic: No UTM parameters found');
        return;
      }
      
      console.log('UTM Content Magic: UTM parameters detected', params);
      
      const apiUrl = \`https://\${PROJECT_ID}.supabase.co/rest/v1/content_rules\`;
      const queryParams = new URLSearchParams();
      
      queryParams.append('active', 'eq.true');
      
      if (params.utm_source) {
        queryParams.append('or', \`(condition_type.eq.utm_source,condition_value.eq.\${params.utm_source})\`);
      }
      if (params.utm_medium) {
        queryParams.append('or', \`(condition_type.eq.utm_medium,condition_value.eq.\${params.utm_medium})\`);
      }
      if (params.utm_campaign) {
        queryParams.append('or', \`(condition_type.eq.utm_campaign,condition_value.eq.\${params.utm_campaign})\`);
      }
      if (params.utm_term) {
        queryParams.append('or', \`(condition_type.eq.utm_term,condition_value.eq.\${params.utm_term})\`);
      }
      if (params.utm_content) {
        queryParams.append('or', \`(condition_type.eq.utm_content,condition_value.eq.\${params.utm_content})\`);
      }
      
      const publishableKey = "${supabase.supabaseUrl.split('//')[1].split('.')[0]}";
      const response = await fetch(\`\${apiUrl}?\${queryParams.toString()}\`, {
        headers: {
          'apikey': publishableKey,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(\`HTTP error! status: \${response.status}\`);
      }
      
      const rules = await response.json();
      console.log('UTM Content Magic: Received rules:', rules);
      
      if (rules && rules.length > 0) {
        applyContentRules(rules);
      } else {
        console.log('UTM Content Magic: No matching rules found');
      }
    } catch (error) {
      console.error('UTM Content Magic: Error initializing:', error);
    }
  };
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
    `;
  };

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
      
      setRules([data[0], ...rules]);
      
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
    } catch (error) {
      console.error('Error creating rule:', error);
      toast({
        title: "Error",
        description: "Failed to create content rule",
        variant: "destructive"
      });
    }
  };

  const toggleRuleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('content_rules')
        .update({ active: !currentStatus })
        .eq('id', id);
      
      if (error) throw error;
      
      setRules(rules.map(rule => 
        rule.id === id ? { ...rule, active: !currentStatus } : rule
      ));
      
      toast({
        title: "Success",
        description: `Rule ${!currentStatus ? 'activated' : 'deactivated'} successfully`,
      });
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
      
      setRules(rules.filter(rule => rule.id !== id));
      
      toast({
        title: "Success",
        description: "Content rule deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting rule:', error);
      toast({
        title: "Error",
        description: "Failed to delete content rule",
        variant: "destructive"
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Text copied to clipboard",
    });
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  if
