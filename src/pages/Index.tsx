
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
    // Get the project ID from the Supabase URL
    const projectId = supabase.supabaseUrl.split('//')[1].split('.')[0];
    // Get the anon key 
    const anonKey = supabase.supabaseKey;
    
    return `
// UTM Content Magic Script (v1.0)
(function() {
  const PROJECT_ID = "${projectId}";
  const ANON_KEY = "${anonKey}";
  
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
      
      const response = await fetch(\`\${apiUrl}?\${queryParams.toString()}\`, {
        headers: {
          'apikey': ANON_KEY,
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

  // If user not logged in, show auth check
  if (!user) {
    return <AuthRequired>{null}</AuthRequired>;
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">UTM Content Magic</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="text-sm">{user.email}</span>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <Tabs defaultValue="rules">
        <TabsList className="mb-6">
          <TabsTrigger value="rules">Content Rules</TabsTrigger>
          <TabsTrigger value="integration">Integration</TabsTrigger>
        </TabsList>

        <TabsContent value="rules">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
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
                      value={newRule.description || ''} 
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
            </div>
            
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-bold mb-4">Your Content Rules</h2>
              
              {loading ? (
                <div className="text-center py-8">Loading rules...</div>
              ) : rules.length === 0 ? (
                <div className="text-center py-8 border rounded-lg bg-muted/50">
                  <p className="text-lg mb-2">No content rules found</p>
                  <p className="text-sm text-muted-foreground">Create your first rule to start personalizing content based on UTM parameters</p>
                </div>
              ) : (
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
                          <p className="text-sm font-medium mb-1">Replacement HTML</p>
                          <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
                            {rule.replacement_content}
                          </pre>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="integration">
          <Card>
            <CardHeader>
              <CardTitle>Website Integration</CardTitle>
              <CardDescription>
                Add this script to your website to enable dynamic content based on UTM parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Script Status</Label>
                  <Button 
                    onClick={uploadScript} 
                    disabled={isUploadingScript}
                    size="sm"
                  >
                    {isUploadingScript ? "Generating Script..." : "Generate Script"}
                  </Button>
                </div>
                
                {scriptUrl ? (
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-sm font-medium">Script URL:</p>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => copyToClipboard(scriptUrl)}
                          title="Copy Script URL"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => window.open(scriptUrl, '_blank')}
                          title="Open Script in New Tab"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <code className="text-xs break-all block">{scriptUrl}</code>
                  </div>
                ) : (
                  <div className="bg-muted p-4 rounded-lg text-center">
                    <p className="text-sm">No script generated yet. Click "Generate Script" to create one.</p>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label>Installation Instructions</Label>
                <div className="bg-muted p-4 rounded-lg space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-1">1. Copy this script tag</p>
                    <div className="relative">
                      <pre className="bg-background p-3 rounded border text-xs overflow-x-auto">
                        {scriptUrl 
                          ? `<script src="${scriptUrl}" async></script>` 
                          : '<script src="YOUR_SCRIPT_URL" async></script>'}
                      </pre>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="absolute top-2 right-2"
                        onClick={() => copyToClipboard(scriptUrl 
                          ? `<script src="${scriptUrl}" async></script>` 
                          : '<script src="YOUR_SCRIPT_URL" async></script>')}
                        disabled={!scriptUrl}
                        title="Copy Script Tag"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium mb-1">2. Add to your website</p>
                    <ul className="text-sm space-y-2 list-disc pl-5">
                      <li>For <strong>Webflow</strong>: Go to Project Settings → Custom Code → Footer Code and paste the script tag</li>
                      <li>For <strong>WordPress</strong>: Use a header and footer plugin, or add directly to your theme's footer.php</li>
                      <li>For <strong>Shopify</strong>: Go to Online Store → Themes → Edit Code → Layout → theme.liquid and paste before the closing &lt;/head&gt; tag</li>
                    </ul>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium mb-1">3. Test your implementation</p>
                    <p className="text-sm">
                      Visit your website with UTM parameters that match your rules to test.
                      <br />
                      Example: <code className="text-xs bg-background p-1 rounded">https://yourwebsite.com/?utm_source=google</code>
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Advanced: Debug Mode</Label>
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm mb-2">
                    To enable debug mode, open your browser console on your website to view detailed logs about how the UTM rules are being applied.
                  </p>
                  <div className="bg-background p-3 rounded border text-xs font-mono overflow-x-auto">
                    <p>// Sample console output when rules are applied</p>
                    <p className="text-green-500">UTM Content Magic: UTM parameters detected &#123;utm_source: "google"&#125;</p>
                    <p className="text-green-500">UTM Content Magic: Received rules: [&#123;...&#125;]</p>
                    <p className="text-green-500">UTM Content Magic: Replaced content for .hero h1</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Index;
