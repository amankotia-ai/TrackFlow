import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigation } from "@/contexts/NavigationContext";
import { cn } from "@/lib/utils";
import "@/components/ui/solid-icons.css";
import { 
  // Regular icons
  BarChart, 
  Settings, 
  PanelLeft, 
  Code, 
  LogOut,
  FileText,
  LayoutDashboard,
  LineChart,
  ChevronRight,
  Folder,
  FolderOpen,
  Plug,
  LayoutGrid,
  ExternalLink,
  BarChart2,
  Globe,
  TrendingUp,
  RefreshCcw,
  Megaphone,
  Target
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Import solid icons from a custom file or library
const SolidIcon = ({ icon, className, active = false }: { icon: React.ReactNode, className?: string, active?: boolean }) => (
  <div className={cn(
    active ? "solid-icon-active" : "solid-icon",
    "flex items-center justify-center",
    className
  )}>
    {icon}
  </div>
);

interface MainSidebarProps {
  collapsed: boolean;
  toggleSidebar: () => void;
}

interface NavItem {
  icon: React.ReactNode;
  solidIcon?: React.ReactNode;
  label: string;
  path: string;
  tooltip: string;
  count?: number;
  children?: NavItem[];
}

const MainSidebar: React.FC<MainSidebarProps> = ({ collapsed, toggleSidebar }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { isFirstLoad } = useNavigation();
  const [expandedFolders, setExpandedFolders] = useState<string[]>(['analytics', 'content']);
  
  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const isActive = (path: string) => {
    // Exact match for root and overview analytics page
    if (path === '/' || path === '/analytics') {
      return location.pathname === path;
    }
    
    // For other paths, check if the current path starts with the given path
    return location.pathname.startsWith(path);
  };

  const toggleFolder = (folderName: string) => {
    setExpandedFolders(prev => {
      if (prev.includes(folderName)) {
        return prev.filter(f => f !== folderName);
      } else {
        return [...prev, folderName];
      }
    });
  };

  const isFolderExpanded = (folderName: string) => {
    return expandedFolders.includes(folderName);
  };
  
  // Navigation items
  const navItems: NavItem[] = [
    { 
      icon: <LayoutGrid className="h-5 w-5" />,
      solidIcon: <SolidIcon icon={<LayoutGrid className="h-5 w-5 fill-current" />} />,
      label: "Content", 
      path: "/pages",
      tooltip: "Content Management",
      children: [
        {
          icon: <Globe className="h-4 w-4" />,
          solidIcon: <SolidIcon icon={<Globe className="h-4 w-4 fill-current" />} />,
          label: "Pages",
          path: "/pages",
          tooltip: "Manage Pages"
        },
        {
          icon: <Megaphone className="h-4 w-4" />,
          solidIcon: <SolidIcon icon={<Megaphone className="h-4 w-4 fill-current" />} />,
          label: "Campaigns",
          path: "/campaigns",
          tooltip: "Manage Campaigns"
        },
        {
          icon: <Target className="h-4 w-4" />,
          solidIcon: <SolidIcon icon={<Target className="h-4 w-4 fill-current" />} />,
          label: "Content Rules",
          path: "/content/rules",
          tooltip: "All Content Rules"
        }
      ]
    },
    {
      icon: <Plug className="h-5 w-5" />,
      solidIcon: <SolidIcon icon={<Plug className="h-5 w-5 fill-current" />} />,
      label: "Integration",
      path: "/integration",
      tooltip: "Script Integration"
    },
    {
      icon: <BarChart className="h-5 w-5" />,
      solidIcon: <SolidIcon icon={<BarChart className="h-5 w-5 fill-current" />} />,
      label: "Analytics",
      path: "/analytics",
      tooltip: "Analytics",
      children: [
        {
          icon: <LayoutGrid className="h-4 w-4" />,
          solidIcon: <SolidIcon icon={<LayoutGrid className="h-4 w-4 fill-current" />} />,
          label: "Overview",
          path: "/analytics",
          tooltip: "Analytics Overview",
          count: 18
        },
        {
          icon: <Globe className="h-4 w-4" />,
          solidIcon: <SolidIcon icon={<Globe className="h-4 w-4 fill-current" />} />,
          label: "Sources",
          path: "/analytics/sources",
          tooltip: "Sources",
          count: 8
        },
        {
          icon: <Megaphone className="h-4 w-4" />,
          solidIcon: <SolidIcon icon={<Megaphone className="h-4 w-4 fill-current" />} />,
          label: "Campaigns",
          path: "/analytics/campaigns",
          tooltip: "Campaigns",
          count: 6
        },
        {
          icon: <TrendingUp className="h-4 w-4" />,
          solidIcon: <SolidIcon icon={<TrendingUp className="h-4 w-4 fill-current" />} />,
          label: "Insights",
          path: "/analytics/insights",
          tooltip: "Insights",
          count: 4
        }
      ]
    },
    { 
      icon: <Settings className="h-5 w-5" />,
      solidIcon: <SolidIcon icon={<Settings className="h-5 w-5 fill-current" />} />,
      label: "Settings", 
      path: "/settings",
      tooltip: "Settings"
    },
    { 
      icon: <LineChart className="h-5 w-5" />,
      solidIcon: <SolidIcon icon={<LineChart className="h-5 w-5 fill-current" />} />,
      label: "Support", 
      path: "/support",
      tooltip: "Support",
      count: 1
    },
  ];

  // Animation variants
  const sidebarVariants = {
    expanded: { width: 250 },
    collapsed: { width: 72 }
  };

  const renderNavItem = (item: NavItem, isChild = false) => {
    const active = isActive(item.path);
    const hasChildren = item.children && item.children.length > 0;
    const isFolder = hasChildren && !isChild;
    const folderExpanded = isFolderExpanded(item.label.toLowerCase());
    
    // Determine which icon to show based on active state
    const iconToShow = active 
      ? <SolidIcon icon={item.icon} active={true} className="w-5 h-5" /> 
      : <SolidIcon icon={item.icon} className="w-5 h-5" />;
    
    return (
      <div key={item.path}>
        <Tooltip delayDuration={collapsed ? 100 : 1000}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "w-full flex items-center justify-between relative px-2 h-10 text-gray-500",
                active && !isFolder ? "bg-[#F3EFEA] text-gray-900 font-medium" : "hover:text-gray-700",
                isChild ? "pl-7" : "",
                isChild && active ? "bg-[#F3EFEA]" : ""
              )}
              onClick={() => isFolder ? toggleFolder(item.label.toLowerCase()) : navigate(item.path)}
            >
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 flex items-center justify-center">
                  {isFolder 
                    ? (folderExpanded 
                        ? <FolderOpen className="h-5 w-5" /> 
                        : <Folder className="h-5 w-5" />)
                    : iconToShow}
                </span>
                {!collapsed && (
                  <span className={cn("text-sm", isChild ? "font-normal" : "font-medium")}>{item.label}</span>
                )}
              </div>
              {!collapsed && (
                <div className="flex items-center gap-1">
                  {item.count !== undefined && (
                    <span className="flex items-center justify-center h-6 w-6 rounded-full bg-white text-xs text-gray-500">
                      {item.count}
                    </span>
                  )}
                  {isFolder && (
                    <ChevronRight className={cn("h-4 w-4 transition-transform", folderExpanded ? "rotate-90" : "")} />
                  )}
                </div>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right" className={cn(!collapsed && "hidden")}>
            {item.tooltip}
          </TooltipContent>
        </Tooltip>
        
        {!collapsed && hasChildren && (
          <div>
            {folderExpanded && (
              <div 
                className={`overflow-hidden ${item.children.length > 1 ? "py-1 mx-1 rounded-md" : ""}`}
                style={{ 
                  height: "auto",
                  opacity: 1
                }}
              >
                {item.children.map(child => renderNavItem(child, true))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <motion.div 
      className="h-screen bg-[#F7F7F7] flex flex-col justify-between overflow-y-auto z-20 fixed"
      initial={isFirstLoad ? "expanded" : false}
      animate={collapsed ? "collapsed" : "expanded"}
      variants={sidebarVariants}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      {/* Top section - Logo and collapse button */}
      <div className="px-3 pt-6 pl-[14px]">
        <div className="flex items-center mb-6">
          {!collapsed && (
            <motion.div 
              initial={isFirstLoad ? { opacity: 0 } : false}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <div className="w-8 h-8 bg-[#F3EFEA] rounded flex items-center justify-center">
                <BarChart2 className="h-4 w-4 text-gray-600" />
              </div>
              <h1 className="text-base font-semibold text-gray-700">
                TrackFlow
              </h1>
            </motion.div>
          )}
        </div>
        <div className="h-[1px] bg-gray-200 mb-5 mx-1"></div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 px-2 overflow-y-auto">
        <nav className="space-y-1">
          {navItems.map(item => renderNavItem(item))}
        </nav>
      </div>

      {/* Bottom section - User info and sign out */}
      <div className="p-3 border-t border-gray-200">
        {user && (
          <div className="mb-3">
            {!collapsed ? (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-900 font-medium">
                  {user.email?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {user.email?.split('@')[0]}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {user.email}
                  </div>
                </div>
              </div>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex justify-center">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-900 font-medium">
                      {user.email?.charAt(0).toUpperCase()}
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {user.email}
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        )}
        <Button
          variant="ghost"
          className="w-full flex items-center justify-start gap-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          onClick={handleSignOut}
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && <span className="text-sm font-medium">Sign Out</span>}
        </Button>
      </div>
    </motion.div>
  );
};

export default MainSidebar; 