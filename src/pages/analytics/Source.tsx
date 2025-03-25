import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import AuthRequired from "@/components/AuthRequired";
import { motion } from "framer-motion";
import { fadeIn } from "@/lib/animations";
import SourceDashboard from "@/components/source/SourceDashboard";
import Layout from "@/components/Layout";

const Source = () => {
  const { user } = useAuth();
  
  // If user not logged in, show auth check
  if (!user) {
    return <AuthRequired>{null}</AuthRequired>;
  }

  return (
    <Layout title="Sources">
      <motion.div
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <SourceDashboard />
      </motion.div>
    </Layout>
  );
};

export default Source; 