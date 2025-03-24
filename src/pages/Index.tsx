import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
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
import { PlusCircle, Trash2, Copy, ExternalLink, FileCode, Code } from "lucide-react";

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
  const { toast } = useToast();
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
    fetchRules();
    checkScriptExists();
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
      
      const response = await fetch('/src/scripts/utm-magic.js');
      const scriptContent = await response.text();
      
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
    } catch (error) {
      console.error('Error uploading script:', error);
      toast({
        title: "Error",
        description: "Failed to upload script",
        variant: "destructive"
      });
    } finally {
      setIsUploadingScript(false);
    }
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

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold mb-2">UTM Content Magic</h1>
      <p className="text-lg text-gray-600 mb-8">
        Dynamically personalize your web content based on UTM parameters
      </p>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="create">Create Rule</TabsTrigger>
          <TabsTrigger value="integration">Integration</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard">
          <div className="grid grid-cols-1 gap-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Content Rules</h2>
              <span className="text-sm text-gray-500">{rules.length} rules</span>
            </div>
            
            {loading ? (
              <div className="flex justify-center py-10">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              </div>
            ) : rules.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <p className="text-lg text-gray-500 mb-4">No content rules found</p>
                  <Button onClick={() => {
                    const element = document.querySelector('[data-value="create"]');
                    if (element) {
                      (element as HTMLElement).click();
                    }
                  }}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Your First Rule
                  </Button>
                </CardContent>
              </Card>
            ) : (
              rules.map(rule => (
                <Card key={rule.id} className={!rule.active ? "opacity-60" : ""}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">{rule.name}</CardTitle>
                        {rule.description && (
                          <CardDescription>{rule.description}</CardDescription>
                        )}
                      </div>
                      <Badge variant={rule.active ? "default" : "outline"}>
                        {rule.active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium text-sm mb-1">Condition</h4>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{rule.condition_type}</Badge>
                            <span>=</span>
                            <Badge>{rule.condition_value}</Badge>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium text-sm mb-1">Selector</h4>
                          <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm">
                            {rule.selector}
                          </code>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm mb-1">Replacement Content</h4>
                        <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md border text-sm max-h-24 overflow-y-auto">
                          {rule.replacement_content}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <div className="flex items-center">
                      <Switch
                        checked={rule.active}
                        onCheckedChange={() => toggleRuleStatus(rule.id, rule.active)}
                        className="mr-2"
                      />
                      <span className="text-sm">{rule.active ? "Active" : "Inactive"}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => copyToClipboard(rule.replacement_content)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => deleteRule(rule.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle>Create New Content Rule</CardTitle>
              <CardDescription>
                Define how content should change based on UTM parameters
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Rule Name *</Label>
                    <Input
                      id="name"
                      placeholder="E.g., Homepage Banner for Google Ads"
                      value={newRule.name}
                      onChange={(e) => setNewRule({...newRule, name: e.target.value})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Input
                      id="description"
                      placeholder="Brief description of this rule"
                      value={newRule.description || ""}
                      onChange={(e) => setNewRule({...newRule, description: e.target.value})}
                    />
                  </div>
                </div>
                
                <Separator />
                
                <div className="grid gap-2">
                  <Label htmlFor="selector">CSS Selector *</Label>
                  <Input
                    id="selector"
                    placeholder="E.g., #hero-title or .banner-text"
                    value={newRule.selector}
                    onChange={(e) => setNewRule({...newRule, selector: e.target.value})}
                  />
                  <p className="text-sm text-gray-500">
                    The CSS selector for the element(s) you want to modify
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="condition-type">Condition Type *</Label>
                    <Select
                      value={newRule.condition_type}
                      onValueChange={(value) => setNewRule({...newRule, condition_type: value})}
                    >
                      <SelectTrigger id="condition-type">
                        <SelectValue placeholder="Select a parameter" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="utm_source">UTM Source</SelectItem>
                        <SelectItem value="utm_medium">UTM Medium</SelectItem>
                        <SelectItem value="utm_campaign">UTM Campaign</SelectItem>
                        <SelectItem value="utm_term">UTM Term</SelectItem>
                        <SelectItem value="utm_content">UTM Content</SelectItem>
                        <SelectItem value="referrer">Referrer URL</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="condition-value">Condition Value *</Label>
                    <Input
                      id="condition-value"
                      placeholder="E.g., google or facebook"
                      value={newRule.condition_value}
                      onChange={(e) => setNewRule({...newRule, condition_value: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="replacement-content">Replacement Content *</Label>
                  <Textarea
                    id="replacement-content"
                    placeholder="The HTML content that will replace the original content"
                    className="min-h-[120px]"
                    value={newRule.replacement_content}
                    onChange={(e) => setNewRule({...newRule, replacement_content: e.target.value})}
                  />
                  <p className="text-sm text-gray-500">
                    HTML is supported. Be careful with quotes and special characters.
                  </p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="active"
                    checked={newRule.active}
                    onCheckedChange={(checked) => setNewRule({...newRule, active: checked})}
                  />
                  <Label htmlFor="active">Active</Label>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={createRule}>
                Create Rule
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="integration">
          <Card>
            <CardHeader>
              <CardTitle>Integration</CardTitle>
              <CardDescription>
                Add UTM Content Magic to your website with a simple script tag
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                {!scriptUrl ? (
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-md p-4 text-center">
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Upload the UTM Content Magic script to get started
                    </p>
                    <Button 
                      onClick={uploadScript} 
                      disabled={isUploadingScript}
                    >
                      {isUploadingScript ? (
                        <>
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                          Uploading...
                        </>
                      ) : (
                        <>
                          <FileCode className="mr-2 h-4 w-4" />
                          Upload Script
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="grid gap-2">
                      <Label>Add to your website</Label>
                      <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md border font-mono text-sm overflow-x-auto">
                        {`<script src="${scriptUrl}"></script>`}
                      </div>
                      <div className="flex justify-end mt-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => copyToClipboard(`<script src="${scriptUrl}"></script>`)}
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          Copy
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="rounded-md bg-blue-50 p-4">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <ExternalLink className="h-5 w-5 text-blue-400" />
                          </div>
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-blue-800">Testing your integration</h3>
                            <div className="mt-2 text-sm text-blue-700">
                              <p>
                                Test your rules by appending UTM parameters to your URL:
                                <br />
                                <code className="bg-blue-100 px-1 py-0.5 rounded text-xs">
                                  ?utm_source=test&utm_medium=demo
                                </code>
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <h3 className="text-lg font-medium mb-2">Webflow Integration</h3>
                        <div className="space-y-3">
                          <p className="text-sm text-gray-600">
                            To add UTM Content Magic to your Webflow site:
                          </p>
                          
                          <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md border">
                            <ol className="list-decimal ml-5 space-y-2 text-sm">
                              <li>Go to your Webflow project dashboard</li>
                              <li>Navigate to <strong>Project Settings</strong> → <strong>Custom Code</strong></li>
                              <li>In the <strong>Footer Code</strong> section, paste the script tag shown above</li>
                              <li>Save and publish your site</li>
                            </ol>
                          </div>
                          
                          <div className="flex items-center p-3 bg-amber-50 border border-amber-200 rounded-md">
                            <Code className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0" />
                            <p className="text-sm text-amber-800">
                              Make sure to publish your Webflow site after adding the script for changes to take effect.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Index;
