import { Link } from "wouter";
import { 
  FileText, ShoppingCart, Package, BarChart3, Users, Lightbulb, 
  TrendingUp, TrendingDown, ArrowRight, Activity, CheckCircle2, 
  AlertCircle, Clock, DollarSign, Box, ShoppingBag
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { AlertTriangle } from "lucide-react";
import ChannelAnalytics from "@/components/ChannelAnalytics";
import TimePeriodSelector from "@/components/TimePeriodSelector";
import { TimePeriod } from "@shared/dateRanges";

// Animated counter component
function AnimatedCounter({ end, duration = 2000, prefix = "", suffix = "" }: { end: number; duration?: number; prefix?: string; suffix?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      setCount(Math.floor(progress * end));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration]);

  return <span>{prefix}{count.toLocaleString()}{suffix}</span>;
}

// Simple sparkline component
function Sparkline({ data, color = "rgb(59, 130, 246)" }: { data: number[]; color?: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - ((value - min) / range) * 100;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg className="w-full h-12" viewBox="0 0 100 100" preserveAspectRatio="none">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export default function Dashboard() {
  // Demo mode state (persisted in localStorage)
  const [isDemoMode, setIsDemoMode] = useState(() => {
    const stored = localStorage.getItem('dashboard-demo-mode');
    return stored === 'true';
  });

  // Time period state (persisted in localStorage)
  const [timePeriod, setTimePeriod] = useState<TimePeriod>(() => {
    const stored = localStorage.getItem('dashboard-time-period');
    return (stored as TimePeriod) || 'today';
  });

  // Persist time period changes to localStorage
  const handleTimePeriodChange = (period: TimePeriod) => {
    setTimePeriod(period);
    localStorage.setItem('dashboard-time-period', period);
  };

  // Fetch real metrics from database with time period filter
  const { data: realMetrics, isLoading: metricsLoading } = trpc.dashboard.getMetrics.useQuery(
    { period: timePeriod },
    {
      enabled: !isDemoMode,
    }
  );

  // Toggle demo mode and persist to localStorage
  const toggleDemoMode = (checked: boolean) => {
    setIsDemoMode(checked);
    localStorage.setItem('dashboard-demo-mode', String(checked));
  };

  // Demo data (fallback)
  const demoData = {
    totalRevenue: 1200000,
    activeCases: 89,
    inventoryValue: 284000,
    ordersToday: 127,
  };

  // Use real data if available and not in demo mode, otherwise use demo data
  const metrics = isDemoMode ? demoData : (realMetrics || demoData);
  const modules = [
    {
      title: "Cases",
      description: "Carrier dispute management",
      icon: FileText,
      path: "/cases",
      gradient: "from-blue-500/20 to-blue-600/20",
      iconColor: "text-blue-500",
      bgColor: "bg-blue-500/10",
      metrics: {
        total: 247,
        active: 89,
        resolved: 158,
        trend: "+12%",
        trendUp: true,
        sparkline: [45, 52, 48, 61, 70, 65, 89],
        insight: "Resolution rate up 12% this month",
      },
      quickActions: [
        { label: "New Case", path: "/cases/new" },
        { label: "View All", path: "/cases" },
      ],
    },
    {
      title: "Orders",
      description: "Multi-channel order sync",
      icon: ShoppingCart,
      path: "/orders",
      gradient: "from-green-500/20 to-green-600/20",
      iconColor: "text-green-500",
      bgColor: "bg-green-500/10",
      metrics: {
        total: 1834,
        active: 127,
        completed: 1707,
        trend: "+23%",
        trendUp: true,
        sparkline: [120, 135, 142, 138, 155, 148, 127],
        insight: "Order volume increased 23% vs last week",
      },
      quickActions: [
        { label: "New Order", path: "/orders/new" },
        { label: "View All", path: "/orders" },
      ],
    },
    {
      title: "Inventory",
      description: "PO & stock management",
      icon: Package,
      path: "/inventory",
      gradient: "from-purple-500/20 to-purple-600/20",
      iconColor: "text-purple-500",
      bgColor: "bg-purple-500/10",
      metrics: {
        total: 3421,
        lowStock: 23,
        value: "$284K",
        trend: "-5%",
        trendUp: false,
        sparkline: [3580, 3520, 3490, 3455, 3430, 3425, 3421],
        insight: "23 items need reordering",
      },
      quickActions: [
        { label: "Add Stock", path: "/inventory/new" },
        { label: "View All", path: "/inventory" },
      ],
    },
    {
      title: "Reports",
      description: "Analytics & insights",
      icon: BarChart3,
      path: "/reports",
      gradient: "from-orange-500/20 to-orange-600/20",
      iconColor: "text-orange-500",
      bgColor: "bg-orange-500/10",
      metrics: {
        total: 48,
        scheduled: 12,
        custom: 36,
        trend: "+8%",
        trendUp: true,
        sparkline: [32, 35, 38, 41, 43, 45, 48],
        insight: "8 new reports created this week",
      },
      quickActions: [
        { label: "New Report", path: "/reports/new" },
        { label: "View All", path: "/reports" },
      ],
    },
    {
      title: "CRM",
      description: "Customer relationships",
      icon: Users,
      path: "/crm/contacts",
      gradient: "from-pink-500/20 to-pink-600/20",
      iconColor: "text-pink-500",
      bgColor: "bg-pink-500/10",
      metrics: {
        total: 892,
        active: 456,
        companies: 234,
        trend: "+15%",
        trendUp: true,
        sparkline: [380, 395, 410, 425, 438, 447, 456],
        insight: "134 new contacts added this month",
      },
      quickActions: [
        { label: "Add Contact", path: "/crm/contacts/new" },
        { label: "View All", path: "/crm/contacts" },
      ],
    },
    {
      title: "Intelligence",
      description: "Business intelligence",
      icon: Lightbulb,
      path: "/intelligence/brand",
      gradient: "from-cyan-500/20 to-cyan-600/20",
      iconColor: "text-cyan-500",
      bgColor: "bg-cyan-500/10",
      metrics: {
        total: 156,
        insights: 89,
        alerts: 12,
        trend: "Active",
        trendUp: true,
        sparkline: [65, 72, 78, 81, 85, 87, 89],
        insight: "12 actionable insights generated today",
      },
      quickActions: [
        { label: "View Insights", path: "/intelligence/brand" },
        { label: "View All", path: "/intelligence" },
      ],
    },
  ];

  // System-wide metrics (using real or demo data)
  const systemMetrics = [
    {
      label: "Total Revenue",
      value: metrics.totalRevenue >= 1000000 
        ? `$${(metrics.totalRevenue / 1000000).toFixed(1)}M`
        : `$${(metrics.totalRevenue / 1000).toFixed(0)}K`,
      rawValue: metrics.totalRevenue,
      change: "+18.2%",
      changeUp: true,
      icon: DollarSign,
      color: "text-green-500",
    },
    {
      label: "Active Cases",
      value: String(metrics.activeCases),
      rawValue: metrics.activeCases,
      change: "+12",
      changeUp: true,
      icon: Activity,
      color: "text-blue-500",
    },
    {
      label: "Inventory Value",
      value: `$${(metrics.inventoryValue / 1000).toFixed(0)}K`,
      rawValue: metrics.inventoryValue,
      change: "-5.3%",
      changeUp: false,
      icon: Box,
      color: "text-purple-500",
    },
    {
      label: "Orders Today",
      value: String(metrics.ordersToday),
      rawValue: metrics.ordersToday,
      change: "+23%",
      changeUp: true,
      icon: ShoppingBag,
      color: "text-orange-500",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header with Time Period Selector and Demo Mode Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            Hellcat AI V4
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Carrier Dispute Claims Management System
          </p>
        </div>
        <div className="flex items-center gap-4">
          <TimePeriodSelector value={timePeriod} onChange={handleTimePeriodChange} />
          <div className="flex items-center gap-3 px-4 py-2 bg-muted rounded-lg">
            <Label htmlFor="demo-mode" className="text-sm font-medium cursor-pointer">
              Demo Mode
            </Label>
            <Switch
              id="demo-mode"
              checked={isDemoMode}
              onCheckedChange={toggleDemoMode}
            />
          </div>
        </div>
      </div>

      {/* Demo Mode Warning Banner */}
      {isDemoMode && (
        <Card className="border-l-4 border-orange-500 bg-gradient-to-r from-orange-500/10 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="text-orange-500" size={20} />
              <div>
                <p className="font-medium text-sm">Demo Mode Active</p>
                <p className="text-xs text-muted-foreground">
                  You are viewing sample data. Toggle off Demo Mode to see real metrics from your database.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {systemMetrics.map((metric) => (
          <Card key={metric.label} className="relative overflow-hidden group hover:shadow-lg transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg ${metric.color} bg-current/10`}>
                  <metric.icon className={metric.color} size={20} />
                </div>
                <Badge variant={metric.changeUp ? "default" : "secondary"} className="gap-1">
                  {metric.changeUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {metric.change}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{metric.label}</p>
              <p className="text-3xl font-bold mt-1">
                {metric.value}
                {isDemoMode && <Badge variant="outline" className="ml-2 text-xs">Demo</Badge>}
              </p>
            </CardContent>
            <div className="absolute inset-0 bg-gradient-to-br from-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </Card>
        ))}
      </div>

      {/* Channel Analytics Widget */}
      <ChannelAnalytics period={timePeriod} />

      {/* Status Banner */}
      <Card className="border-l-4 border-primary bg-gradient-to-r from-primary/5 to-transparent">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <CheckCircle2 className="text-primary" size={24} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">System Status: All Systems Operational</h3>
              <p className="text-muted-foreground mt-1">
                All modules running smoothly. Last sync: 2 minutes ago. Next scheduled maintenance: None planned.
              </p>
            </div>
            <Badge variant="outline" className="gap-1">
              <Activity size={12} className="animate-pulse" />
              Live
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Modules Grid */}
      <div>
        <h2 className="text-2xl font-semibold mb-6">System Modules</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module) => (
            <Card 
              key={module.path} 
              className="group relative overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              {/* Gradient background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${module.gradient} opacity-0 group-hover:opacity-100 transition-opacity`} />
              
              <CardHeader className="relative">
                <div className="flex items-start justify-between mb-2">
                  <div className={`p-3 rounded-xl ${module.bgColor} group-hover:scale-110 transition-transform`}>
                    <module.icon className={module.iconColor} size={24} />
                  </div>
                  <Badge variant={module.metrics.trendUp ? "default" : "secondary"} className="gap-1">
                    {module.metrics.trendUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {module.metrics.trend}
                  </Badge>
                </div>
                <CardTitle className="text-xl">{module.title}</CardTitle>
                <CardDescription>{module.description}</CardDescription>
              </CardHeader>

              <CardContent className="relative space-y-4">
                {/* Metrics */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-2xl font-bold">
                      <AnimatedCounter end={module.metrics.total} />
                    </p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      <AnimatedCounter end={module.metrics.active} />
                    </p>
                    <p className="text-xs text-muted-foreground">Active</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {typeof module.metrics.value === "string" ? module.metrics.value : <AnimatedCounter end={module.metrics.value || 0} />}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {module.title === "Inventory" ? "Value" : "Done"}
                    </p>
                  </div>
                </div>

                {/* Sparkline */}
                <div className="opacity-60 group-hover:opacity-100 transition-opacity">
                  <Sparkline data={module.metrics.sparkline} color={module.iconColor.replace("text-", "rgb(var(--")} />
                </div>

                {/* AI Insight */}
                <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 text-sm">
                  <Lightbulb size={16} className="text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-muted-foreground">{module.metrics.insight}</p>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2 pt-2">
                  <Button asChild size="sm" variant="outline" className="flex-1 group/btn">
                    <Link href={module.quickActions[0].path}>
                      {module.quickActions[0].label}
                      <ArrowRight size={14} className="ml-1 group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                  <Button asChild size="sm" className="flex-1 group/btn">
                    <Link href={module.path}>
                      {module.quickActions[1].label}
                      <ArrowRight size={14} className="ml-1 group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Implementation Roadmap */}
      <div>
        <h2 className="text-2xl font-semibold mb-6">Implementation Roadmap</h2>
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="text-primary-foreground" size={20} />
              </div>
              <div className="flex-1">
                <p className="font-semibold">Phase 1: Foundation Complete</p>
                <p className="text-sm text-muted-foreground">Navigation, theme, and core modules operational</p>
              </div>
              <Badge>Complete</Badge>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Clock className="text-primary" size={20} />
              </div>
              <div className="flex-1">
                <p className="font-semibold">Phase 2: AI Features</p>
                <p className="text-sm text-muted-foreground">Invoice OCR, voice commands, predictive analytics</p>
              </div>
              <Badge variant="outline">In Progress</Badge>
            </div>
            <div className="flex items-center gap-4 opacity-50">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                <AlertCircle className="text-muted-foreground" size={20} />
              </div>
              <div className="flex-1">
                <p className="font-semibold">Phase 3: Advanced Features</p>
                <p className="text-sm text-muted-foreground">Integrations, mobile app, automation workflows</p>
              </div>
              <Badge variant="secondary">Upcoming</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
