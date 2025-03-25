import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import AuthRequired from "@/components/AuthRequired";
import { motion } from "framer-motion";
import { fadeIn } from "@/lib/animations";
import CampaignDashboard from "@/components/campaign/CampaignDashboard";
import Layout from "@/components/Layout";

const Campaign = () => {
  const { user } = useAuth();
  
  // If user not logged in, show auth check
  if (!user) {
    return <AuthRequired>{null}</AuthRequired>;
  }

  return (
    <Layout title="Campaigns">
      <motion.div
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <CampaignDashboard />
      </motion.div>
    </Layout>
  );
};

export default Campaign; 