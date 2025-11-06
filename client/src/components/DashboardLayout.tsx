import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { 
  LayoutDashboard, 
  LogOut, 
  PanelLeft, 
  FileText, 
  Upload, 
  Settings, 
  Package, 
  Box, 
  FileCheck, 
  SearchCheck, 
  BarChart3, 
  Plus, 
  Search, 
  Bell, 
  Palette, 
  Mail,
  ChevronDown,
  FileStack,
  Monitor,
  Database,
  TrendingUp,
  Plug,
  Users,
  Building2,
  Target,
  Lightbulb,
  Sparkles
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Button } from "./ui/button";
import AIChatWidget from "./AIChatWidget";
import { DensityToggle } from "./DensityToggle";
import { VoiceCommandButton } from "./VoiceCommandButton";
import { Input } from "./ui/input";

// Reorganized menu structure with submenus
const menuStructure = [
  {
    icon: LayoutDashboard,
    label: "Dashboard",
    path: "/",
  },
  {
    icon: FileText,
    label: "Cases",
    items: [
      { label: "All Cases", path: "/cases" },
      { label: "Import Cases", path: "/import" },
      { label: "Case Templates", path: "/cases/templates" },
      { label: "Case Settings", path: "/cases/settings" },
    ],
  },
  {
    icon: Monitor,
    label: "Monitoring",
    items: [
      { label: "Order Monitoring", path: "/orders" },
      { label: "Shipment Audits", path: "/audits" },
      { label: "Gmail Monitoring", path: "/gmail-monitoring" },
      { label: "Sync Status", path: "/sync-status" },
      { label: "PDF Invoice Scanner", path: "/pdf-scanner" },
    ],
  },
  {
    icon: Database,
    label: "Data",
    items: [
      { label: "Products", path: "/products" },
      { label: "Certifications", path: "/certifications" },
    ],
  },
  {
    icon: Package,
    label: "Inventory",
    items: [
      { label: "Purchase Orders", path: "/purchase-orders" },
      { label: "Receiving", path: "/receiving" },
      { label: "Inventory", path: "/inventory" },
    ],
  },
  {
    icon: TrendingUp,
    label: "Reports",
    items: [
      { label: "Analytics", path: "/reports" },
      { label: "Weekly Reports", path: "/reports/weekly" },
      { label: "Performance", path: "/reports/performance" },
    ],
  },
  {
    icon: Users,
    label: "CRM",
    items: [
      { label: "Customers", path: "/crm/customers" },
      { label: "Leads", path: "/crm/leads" },
      { label: "Vendors", path: "/crm/vendors" },
      { label: "Contacts", path: "/crm/contacts" },
      { label: "Companies", path: "/crm/companies" },
      { label: "Deals", path: "/crm/deals" },
      { label: "Analytics", path: "/crm/analytics" },
    ],
  },
  {
    icon: Sparkles,
    label: "AI Intelligence",
    items: [
      { label: "Predictions", path: "/ai/predictions" },
      { label: "Prescriptions", path: "/ai/prescriptions" },
    ],
  },
];

const settingsStructure = [
  {
    icon: Settings,
    label: "Settings",
    items: [
      { icon: Settings, label: "General", path: "/settings" },
      { icon: Palette, label: "Theme Colors", path: "/settings/colors" },
      { icon: Mail, label: "Email Templates", path: "/settings/email-templates" },
      { icon: Plug, label: "Integrations", path: "/settings/integrations" },
    ],
  },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 280;
const MIN_WIDTH = 200;
const MAX_WIDTH = 480;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-6">
            <div className="relative group">
              <div className="relative">
                <img
                  src={APP_LOGO}
                  alt={APP_TITLE}
                  className="h-20 w-20 rounded-xl object-cover shadow"
                />
              </div>
            </div>
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold tracking-tight">{APP_TITLE}</h1>
              <p className="text-sm text-muted-foreground">
                Please sign in to continue
              </p>
            </div>
          </div>
          <Button
            onClick={() => {
              window.location.href = getLoginUrl();
            }}
            size="lg"
            className="w-full shadow-lg hover:shadow-xl transition-all"
          >
            Sign in
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: DashboardLayoutContentProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const [openMenus, setOpenMenus] = useState<string[]>([]);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  // Determine active menu item
  const getActiveLabel = () => {
    for (const menu of menuStructure) {
      if (menu.path === location) return menu.label;
      if (menu.items) {
        const activeItem = menu.items.find(item => item.path === location);
        if (activeItem) return activeItem.label;
      }
    }
    return "Dashboard";
  };

  useEffect(() => {
    if (isCollapsed) {
      setIsResizing(false);
    }
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  const toggleMenu = (label: string) => {
    setOpenMenus(prev =>
      prev.includes(label)
        ? prev.filter(item => item !== label)
        : [...prev, label]
    );
  };

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar
          collapsible="icon"
          className="border-r-0"
          disableTransition={isResizing}
        >
          <SidebarHeader className="h-16 justify-center bg-[#1a1a1a] border-b border-gray-800">
            <div className="flex items-center gap-3 pl-2 group-data-[collapsible=icon]:px-0 transition-all w-full">
              {isCollapsed ? (
                <div className="relative h-10 w-10 shrink-0 group">
                  <img
                    src="/ctf-logo.svg"
                    className="h-10 w-10 object-contain"
                    alt="Catch The Fever"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = APP_LOGO;
                    }}
                  />
                  <button
                    onClick={toggleSidebar}
                    className="absolute inset-0 flex items-center justify-center bg-gray-800 rounded-md opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <PanelLeft className="h-4 w-4 text-white" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src="/ctf-logo.svg"
                      className="h-10 w-auto object-contain shrink-0"
                      alt="Catch The Fever"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = APP_LOGO;
                      }}
                    />
                  </div>
                  <button
                    onClick={toggleSidebar}
                    className="ml-auto h-8 w-8 flex items-center justify-center hover:bg-gray-800 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary shrink-0"
                  >
                    <PanelLeft className="h-4 w-4 text-gray-400" />
                  </button>
                </>
              )}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0">
            <SidebarMenu className="px-2 py-1">
              {menuStructure.map((menu) => {
                const isOpen = openMenus.includes(menu.label);
                const hasSubmenu = menu.items && menu.items.length > 0;
                const isActive = menu.path === location || 
                  (menu.items && menu.items.some(item => item.path === location));

                if (!hasSubmenu) {
                  // Simple menu item
                  return (
                    <SidebarMenuItem key={menu.label}>
                      <SidebarMenuButton
                        isActive={isActive}
                        onClick={() => menu.path && setLocation(menu.path)}
                        tooltip={menu.label}
                        className="h-10 transition-all font-normal"
                      >
                        <menu.icon
                          className={`h-4 w-4 ${isActive ? "text-primary" : ""}`}
                        />
                        <span>{menu.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                }

                // Menu with submenu
                return (
                  <Collapsible
                    key={menu.label}
                    open={isOpen}
                    onOpenChange={() => toggleMenu(menu.label)}
                    className="group/collapsible"
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                          isActive={isActive}
                          tooltip={menu.label}
                          className="h-10 transition-all font-normal"
                        >
                          <menu.icon
                            className={`h-4 w-4 ${isActive ? "text-primary" : ""}`}
                          />
                          <span>{menu.label}</span>
                          <ChevronDown
                            className={`ml-auto h-4 w-4 transition-transform ${
                              isOpen ? "rotate-180" : ""
                            }`}
                          />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {menu.items!.map((subItem) => {
                            const isSubActive = subItem.path === location;
                            return (
                              <SidebarMenuSubItem key={subItem.path}>
                                <SidebarMenuSubButton
                                  isActive={isSubActive}
                                  onClick={() => setLocation(subItem.path)}
                                  className="h-9"
                                >
                                  <span>{subItem.label}</span>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            );
                          })}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                );
              })}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-3 border-t">
            {/* Settings Menu */}
            <SidebarMenu className="px-2 mb-2">
              {settingsStructure.map((menu) => {
                const isOpen = openMenus.includes(menu.label);
                const isActive = menu.items!.some(item => item.path === location);

                return (
                  <Collapsible
                    key={menu.label}
                    open={isOpen}
                    onOpenChange={() => toggleMenu(menu.label)}
                    className="group/collapsible"
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                          isActive={isActive}
                          tooltip={menu.label}
                          className="h-9 transition-all font-normal text-xs"
                        >
                          <menu.icon
                            className={`h-3.5 w-3.5 ${isActive ? "text-primary" : ""}`}
                          />
                          <span>{menu.label}</span>
                          <ChevronDown
                            className={`ml-auto h-3.5 w-3.5 transition-transform ${
                              isOpen ? "rotate-180" : ""
                            }`}
                          />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {menu.items!.map((subItem) => {
                            const isSubActive = subItem.path === location;
                            return (
                              <SidebarMenuSubItem key={subItem.path}>
                                <SidebarMenuSubButton
                                  isActive={isSubActive}
                                  onClick={() => setLocation(subItem.path)}
                                  className="h-8 text-xs"
                                >
                                  {subItem.icon && <subItem.icon className="h-3 w-3" />}
                                  <span>{subItem.label}</span>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            );
                          })}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                );
              })}
            </SidebarMenu>

            {/* User Profile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-accent/50 transition-colors w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar className="h-9 w-9 border shrink-0">
                    <AvatarFallback className="text-xs font-medium">
                      {user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium truncate leading-none">
                      {user?.name || "-"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-1.5">
                      {user?.email || "-"}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => {
            if (isCollapsed) return;
            setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset>
        {/* ShipStation-style header */}
        <div className="ss-header flex border-b h-14 items-center justify-between px-4 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40">
          <div className="flex items-center gap-3">
            {isMobile && <SidebarTrigger className="h-9 w-9 rounded-lg" />}
            <h1 className="text-lg font-semibold text-white hidden sm:block">
              {getActiveLabel()}
            </h1>
            {/* Quick Actions */}
            <div className="hidden md:flex items-center gap-2 ml-4">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-white hover:bg-[var(--ss-green-700)] gap-1.5"
                onClick={() => setLocation("/cases")}
              >
                <Plus className="h-4 w-4" />
                <span className="hidden lg:inline">New Case</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-white hover:bg-[var(--ss-green-700)] gap-1.5"
                onClick={() => setLocation("/import")}
              >
                <Upload className="h-4 w-4" />
                <span className="hidden lg:inline">Import</span>
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Global Search */}
            <div className="hidden lg:flex items-center relative">
              <Search className="absolute left-2.5 h-4 w-4 text-white/70" />
              <Input
                placeholder="Search cases..."
                className="h-8 w-64 pl-8 bg-[var(--ss-green-700)] border-[var(--ss-green-600)] text-white placeholder:text-white/70 focus-visible:ring-white/50"
              />
            </div>
            {/* Notification Bell */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-white hover:bg-[var(--ss-green-700)] relative"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full" />
            </Button>
            {/* Density Toggle */}
            <div className="text-white">
              <VoiceCommandButton />
            <DensityToggle />
            </div>
          </div>
        </div>
        <main className="flex-1 p-4">{children}</main>
      </SidebarInset>
      <AIChatWidget />
    </>
  );
}
