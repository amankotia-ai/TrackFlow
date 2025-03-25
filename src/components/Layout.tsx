import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigation } from "@/contexts/NavigationContext";
import { Button } from "@/components/ui/button";
import { LogOut, ArrowLeft, Menu, Plus, Download } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import MainSidebar from "./MainSidebar";
import CreateRuleModal from "./rules/CreateRuleModal";

interface LayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  actionButtons?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children, title, subtitle, showBackButton = false, actionButtons }) => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isFirstLoad } = useNavigation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleRuleCreated = () => {
    // This will trigger a refetch of rules in the Dashboard component
    // by leveraging the AnimatePresence in the main content area
    navigate("/");
  };
  
  return (
    <div className="min-h-screen bg-[#F7F7F7] flex">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <MainSidebar collapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            className="md:hidden fixed inset-0 bg-black/50 z-30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            className="md:hidden fixed inset-y-0 left-0 z-40"
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ ease: "easeOut", duration: 0.25 }}
          >
            <MainSidebar collapsed={false} toggleSidebar={() => setMobileMenuOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div 
        className={`flex-1 transition-all duration-300 ease-in-out bg-[#F7F7F7] p-4 ${
          sidebarCollapsed ? 'md:ml-[72px]' : 'md:ml-[250px]'
        }`}
      >
        <div className="max-w-[1600px] mx-auto rounded-xl bg-white shadow flex flex-col min-h-[calc(100vh-32px)]">
          <div className="p-6 flex flex-col flex-1">
            <motion.header 
              className="flex justify-between items-center mb-8"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              key={title}
            >
              <div className="flex items-center gap-3">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={toggleMobileMenu}
                  className="md:hidden mr-2"
                >
                  <Menu className="h-5 w-5" />
                </Button>
                
                {showBackButton && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => navigate(-1)}
                    className="mr-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                )}
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
                  <div className="text-sm text-gray-500">
                    {subtitle || (
                      <>
                        {title === "Content Rules" && "Manage and organize your content transformation rules"}
                        {title === "Analytics" && "Track and analyze your UTM parameter usage"}
                        {title === "Integration" && "Install and configure the UTM tracking script"}
                        {title === "Sources" && "Manage and organize your traffic sources"}
                        {title === "Campaigns" && "Create and track your marketing campaigns"}
                        {title === "Pages" && "View and manage your website pages and content"}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {actionButtons ? (
                <div className="flex items-center gap-3">
                  {actionButtons}
                </div>
              ) : title === "Content Rules" && (
                <div className="flex items-center gap-3">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-gray-600 hover:text-gray-900"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Rules
                  </Button>
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="bg-gray-900 text-white hover:bg-gray-800"
                    onClick={() => setCreateModalOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Rule
                  </Button>
                </div>
              )}
            </motion.header>
            
            <motion.main
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="pb-10 flex-1 flex flex-col"
              key={`${title}-content`}
            >
              {children}
            </motion.main>
          </div>
        </div>
      </div>

      {/* Create Rule Modal */}
      <CreateRuleModal 
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onRuleCreated={handleRuleCreated}
      />
    </div>
  );
};

export default Layout; 