import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import AuthRequired from "@/components/AuthRequired";
import ScriptIntegration from "@/components/ScriptIntegration";
import Layout from "@/components/Layout";

const Integration = () => {
  const { user } = useAuth();
  
  // If user not logged in, show auth check
  if (!user) {
    return <AuthRequired>{null}</AuthRequired>;
  }

  return (
    <Layout 
      title="Integrations" 
      subtitle="Set up and manage tracking scripts for UTM parameters and user journeys"
    >
      <ScriptIntegration />
    </Layout>
  );
};

export default Integration; 