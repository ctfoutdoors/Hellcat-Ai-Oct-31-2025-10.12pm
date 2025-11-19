import { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/_core/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getLoginUrl } from "@/const";
import {
  LayoutDashboard,
  FileText,
  Package,
  ShoppingCart,
  BarChart3,
  Users,
  Settings as SettingsIcon,
  ChevronDown,
  Menu,
  X,
  Lightbulb,
  LogOut,
  User,
  Palette,
  Calendar,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import VoiceCommand from "./VoiceCommand";
import NotificationPanel from "./NotificationPanel";

interface MenuItem {
  title: string;
  icon: any;
  path?: string;
  children?: { title: string; path: string }[];
}

const menuItems: MenuItem[] = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    path: "/",
  },
  {
    title: "Cases",
    icon: FileText,
    children: [
      { title: "All Cases", path: "/cases" },
      { title: "Import Cases", path: "/import-cases" },
      { title: "Import from ShipStation", path: "/shipstation-auto-import" },
      { title: "Templates", path: "/cases/templates" },
      { title: "Settings", path: "/cases/settings" },
    ],
  },
  {
    title: "Orders",
    icon: ShoppingCart,
    children: [
      { title: "All Orders", path: "/orders" },
      { title: "Order Tracking", path: "/orders/tracking" },
      { title: "Website (CTF)", path: "/orders/website" },
      { title: "Amazon", path: "/orders/amazon" },
      { title: "eBay", path: "/orders/ebay" },
      { title: "Shopify", path: "/orders/shopify" },
      { title: "WooCommerce", path: "/orders/woocommerce" },
      { title: "Other Channels", path: "/orders/other" },
    ],
  },
  {
    title: "Inventory",
    icon: Package,
    children: [
      { title: "Stock Levels", path: "/inventory/stock-levels" },
      { title: "Products", path: "/inventory/products" },
      { title: "Product Source - WooCommerce", path: "/inventory/source/woocommerce" },
      { title: "Master Inventory - ShipStation", path: "/inventory/source/shipstation" },
      { title: "Purchase Orders", path: "/purchase-orders" },
      { title: "Receiving", path: "/inventory/receiving" },
    ],
  },
  {
    title: "Reports",
    icon: BarChart3,
    children: [
      { title: "Analytics", path: "/reports" },
      { title: "Weekly Reports", path: "/reports/weekly" },
      { title: "Performance", path: "/reports/performance" },
    ],
  },
  {
    title: "CRM",
    icon: Users,
    children: [
      { title: "Customers", path: "/crm/customers" },
      { title: "Leads", path: "/crm/leads" },
      { title: "Vendors", path: "/crm/vendors" },
      { title: "Contacts", path: "/crm/contacts" },
      { title: "Companies", path: "/crm/companies" },
      { title: "Deals", path: "/crm/deals" },
      { title: "Analytics", path: "/crm/analytics" },
    ],
  },
  {
    title: "Calendar",
    icon: Calendar,
    path: "/calendar",
  },
  {
    title: "Intelligence",
    icon: Lightbulb,
    children: [
      { title: "Product Intelligence", path: "/intelligence/product" },
      { title: "Variant Intelligence", path: "/intelligence/variant" },
      { title: "Inventory Intelligence", path: "/intelligence/inventory" },
      { title: "Launch Orchestrator", path: "/intelligence/orchestrator" },
      { title: "Mission Control", path: "/intelligence/mission-control" },
      { title: "Templates", path: "/intelligence/templates" },
      { title: "Settings", path: "/intelligence/settings" },
    ],
  },
  {
    title: "Settings",
    icon: SettingsIcon,
    children: [
      { title: "General", path: "/settings" },
      { title: "Email Accounts", path: "/settings/email-accounts" },
      { title: "Email Templates", path: "/settings/email-templates" },
      { title: "Integrations", path: "/settings/integrations" },
    ],
  },
];

const themeOptions = [
  { value: "blue", label: "Blue (ShipStation)" },
  { value: "dark", label: "Dark Gray" },
  { value: "night", label: "Night (Black)" },
  { value: "light", label: "Light" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>(["Cases"]);
  const { user, loading, isAuthenticated } = useAuth();
  const { theme, setTheme } = useTheme();
  const logoutMutation = trpc.auth.logout.useMutation();

  const toggleMenu = (title: string) => {
    setExpandedMenus((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
  };

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    window.location.href = "/";
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="glass p-8 rounded-lg text-center max-w-md">
          <h1 className="text-2xl font-bold mb-4">Hellcat AI V4</h1>
          <p className="text-muted-foreground mb-6">
            Carrier Dispute Claims Management System
          </p>
          <Button asChild className="w-full">
            <a href={getLoginUrl()}>Sign In to Continue</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "glass-strong border-r border-border transition-all duration-300 flex flex-col",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-border flex-shrink-0">
          {!collapsed && (
            <h1 className="text-xl font-bold text-primary">Hellcat AI</h1>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            {collapsed ? <Menu size={20} /> : <X size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-2 space-y-1 flex-1 overflow-y-auto">
          {menuItems.map((item) => (
            <div key={item.title}>
              {item.children ? (
                <>
                  <button
                    onClick={() => toggleMenu(item.title)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <item.icon size={20} />
                      {!collapsed && <span className="text-sm">{item.title}</span>}
                    </div>
                    {!collapsed && (
                      <ChevronDown
                        size={16}
                        className={cn(
                          "transition-transform",
                          expandedMenus.includes(item.title) && "rotate-180"
                        )}
                      />
                    )}
                  </button>
                  {!collapsed && expandedMenus.includes(item.title) && (
                    <div className="ml-9 mt-1 space-y-1">
                      {item.children.map((child) => (
                        <Link key={child.path} href={child.path}>
                          <span
                            className={cn(
                              "block px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer",
                              location === child.path
                                ? "bg-primary text-primary-foreground font-medium"
                                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                            )}
                          >
                            {child.title}
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <Link href={item.path!}>
                  <span
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors cursor-pointer",
                      location === item.path
                        ? "bg-primary text-primary-foreground font-medium"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    <item.icon size={20} />
                    {!collapsed && <span className="text-sm">{item.title}</span>}
                  </span>
                </Link>
              )}
            </div>
          ))}
        </nav>

        {/* Bottom Section: Notifications + Theme + User */}
        <div className="p-2 border-t border-border flex-shrink-0 space-y-2">
          {/* Notification Bell */}
          {!collapsed && (
            <div className="px-2">
              <NotificationPanel />
            </div>
          )}


          {/* User Section */}
          {!collapsed ? (
            <div className="space-y-2">
              <div className="px-3 py-2 rounded-lg bg-secondary/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <User size={16} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user?.name || "User"}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={handleLogout}
              >
                <LogOut size={16} className="mr-2" />
                Logout
              </Button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="w-full p-2 hover:bg-secondary rounded-lg transition-colors flex items-center justify-center"
              title="Logout"
            >
              <LogOut size={20} className="text-muted-foreground" />
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto p-6">{children}</div>
      </main>
      
      {/* Voice Command Floating Button */}
      <VoiceCommand />
    </div>
  );
}
