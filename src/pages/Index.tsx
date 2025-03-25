import React, { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import AuthRequired from "@/components/AuthRequired";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { fadeIn } from "@/lib/animations";
import Dashboard from "@/components/rules/Dashboard";
import Layout from "@/components/Layout";

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redirect to pages if the user is authenticated
    if (user) {
      navigate('/pages');
    }
  }, [user, navigate]);
  
  // If user not logged in, show auth check
  if (!user) {
    return <AuthRequired>{null}</AuthRequired>;
  }

  // This will only show briefly before the redirect happens
  return <div>Redirecting...</div>;
};

export default Index;
