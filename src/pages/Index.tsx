
import React from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import AuthRequired from "@/components/AuthRequired";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, User } from "lucide-react";
import Dashboard from "@/components/rules/Dashboard";
import ScriptIntegration from "@/components/ScriptIntegration";

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  
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
          <Dashboard />
        </TabsContent>
        
        <TabsContent value="integration">
          <ScriptIntegration />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Index;
