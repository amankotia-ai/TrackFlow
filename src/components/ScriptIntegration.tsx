
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Copy, ExternalLink } from "lucide-react";

const ScriptIntegration: React.FC = () => {
  const { toast } = useToast();
  const [scriptUrl, setScriptUrl] = useState<string>("");
  const [isUploadingScript, setIsUploadingScript] = useState(false);

  useEffect(() => {
    checkScriptExists();
  }, []);

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
    // Get the project details in a safe way without accessing protected properties
    const apiUrl = supabase.getUrl().replace('/rest/v1', '');
    const projectId = apiUrl.split('//')[1].split('.')[0];
    
    // Get the anon key via the authorization header that's already set up
    const anonKey = supabase.supabaseUrl.includes('localhost') 
      ? 'SUPABASE_KEY' // For development
      : process.env.REACT_APP_SUPABASE_ANON_KEY || 'SUPABASE_KEY'; // For production
    
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Text copied to clipboard",
    });
  };

  return (
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
  );
};

export default ScriptIntegration;
