import React, { Component, ErrorInfo, ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import AuthRequired from "@/components/AuthRequired";
import { motion } from "framer-motion";
import { fadeIn } from "@/lib/animations";
import AnalyticsDashboard from "@/components/analytics/AnalyticsDashboard";
import Layout from "@/components/Layout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

// Error boundary component to catch errors in the analytics dashboard
class ErrorBoundary extends Component<{ children: ReactNode, fallback?: ReactNode }> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Analytics error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="space-y-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Something went wrong</AlertTitle>
            <AlertDescription>
              <p>There was an error loading the analytics dashboard.</p>
              <p className="text-sm mt-2">{(this.state.error as any)?.message || "Unknown error"}</p>
              <Button 
                onClick={() => this.setState({ hasError: false })} 
                className="mt-4"
                variant="outline"
              >
                Try Again
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    return this.props.children;
  }
}

const Analytics = () => {
  const { user } = useAuth();
  
  // If user not logged in, show auth check
  if (!user) {
    return <AuthRequired>{null}</AuthRequired>;
  }

  return (
    <Layout title="Analytics">
      <motion.div
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <ErrorBoundary>
          <AnalyticsDashboard />
        </ErrorBoundary>
      </motion.div>
    </Layout>
  );
};

export default Analytics; 