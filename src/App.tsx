import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { NavigationProvider } from "@/contexts/NavigationContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Analytics from "./pages/Analytics";
import Integration from "./pages/Integration";
import Source from "./pages/analytics/Source";
import Campaign from "./pages/analytics/Campaign";
import NotFound from "./pages/NotFound";
import Pages from "./pages/Pages";
import CampaignsPage from "./pages/CampaignsPage";
import ContentRules from "./pages/ContentRules";
import CampaignsOverview from "./pages/CampaignsOverview";
import AllRules from "./pages/content/AllRules";
import { AnimatePresence } from "framer-motion";

const queryClient = new QueryClient();

// This component handles route transitions
const AnimatedRoutes = () => {
  const location = useLocation();
  
  return (
    <Routes location={location}>
      <Route path="/" element={<Index />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/analytics" element={<Analytics />} />
      <Route path="/integration" element={<Integration />} />
      <Route path="/analytics/sources" element={<Source />} />
      <Route path="/analytics/campaigns" element={<Campaign />} />
      
      {/* New hierarchy routes */}
      <Route path="/pages" element={<Pages />} />
      <Route path="/campaigns" element={<CampaignsOverview />} />
      <Route path="/campaigns/:pageId" element={<CampaignsPage />} />
      <Route path="/campaigns/:campaignId/content-rules" element={<ContentRules />} />
      <Route path="/content/rules" element={<AllRules />} />
      
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <NavigationProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AnimatedRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </NavigationProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
