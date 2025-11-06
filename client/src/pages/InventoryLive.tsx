import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart,
} from "recharts";
import {
  Search,
  AlertTriangle,
  Clock,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Download,
  Warehouse,
} from "lucide-react";

/**
 * Advanced Live Inventory Tracking Page
 * - 90-day descending inventory graphs with 60/30-day separators
 * - Average daily sales and days remaining
 * - Color-coded reorder warnings (Red/Orange/Yellow/Blue/Green)
 * - Product variations tracking
 * - Multi-warehouse breakdown
 * - AI-powered insights
 */

interface InventoryItem {
  id: number;
  sku: string;
  name: string;
  variations?: { type: string; value: string }[];
  totalStock: number;
  avgDailySales: number;
  daysRemaining: number;
  warningLevel: "critical" | "warning" | "reorder" | "optimal" | "healthy";
  warehouses: {
    id: number;
    name: string;
    stock: number;
    percentage: number;
  }[];
  replenishment?: {
    orderNumber: string;
    quantity: number;
    expectedArrival: string;
    daysUntilArrival: number;
  };
  history90Days: { date: string; quantity: number }[];
  aiInsights: {
    type: string;
    message: string;
    confidence: number;
  }[];
}

// Generate mock data
function generateMockData(): InventoryItem[] {
  const items: InventoryItem[] = [];
  const skuPrefixes = ["BCFC", "HCRC", "BFCS"];
  
  for (let i = 0; i < 50; i++) {
    const prefix = skuPrefixes[Math.floor(Math.random() * skuPrefixes.length)];
    const sku = `${prefix}-ZR-761${String.fromCharCode(65 + i)}`;
    const avgDailySales = Math.random() * 20 + 5;
    const totalStock = Math.floor(Math.random() * 500 + 50);
    const daysRemaining = Math.floor(totalStock / avgDailySales);
    
    // Generate 90-day descending history
    const history90Days = [];
    let currentStock = totalStock;
    for (let day = 90; day >= 0; day--) {
      const date = new Date(Date.now() - day * 24 * 60 * 60 * 1000);
      history90Days.push({
        date: date.toISOString().split("T")[0],
        quantity: Math.max(0, currentStock + Math.floor(Math.random() * 40 - 20)),
      });
    }
    
    // Determine warning level
    const hasReplenishment = Math.random() > 0.5;
    const replenishmentArrival = hasReplenishment ? Math.floor(Math.random() * 20 + 5) : null;
    
    let warningLevel: InventoryItem["warningLevel"] = "healthy";
    if (!hasReplenishment && daysRemaining < 7) {
      warningLevel = "critical";
    } else if (hasReplenishment && replenishmentArrival && replenishmentArrival > daysRemaining - 2) {
      warningLevel = "warning";
    } else if (daysRemaining >= 7 && daysRemaining < 14) {
      warningLevel = "reorder";
    } else if (daysRemaining >= 14 && daysRemaining < 30) {
      warningLevel = "optimal";
    }
    
    // Warehouse breakdown
    const warehouseCount = Math.floor(Math.random() * 3) + 2;
    const warehouses = [];
    let remaining = totalStock;
    for (let w = 0; w < warehouseCount; w++) {
      const isLast = w === warehouseCount - 1;
      const stock = isLast ? remaining : Math.floor(remaining * Math.random() * 0.6);
      remaining -= stock;
      warehouses.push({
        id: w + 1,
        name: `Warehouse ${String.fromCharCode(65 + w)}`,
        stock,
        percentage: Math.floor((stock / totalStock) * 100),
      });
    }
    
    // AI insights
    const aiInsights = [];
    if (warningLevel === "critical") {
      aiInsights.push({
        type: "reorder",
        message: "Critical stock level! Immediate reorder recommended to avoid stockout.",
        confidence: 95,
      });
    }
    if (daysRemaining < 14) {
      aiInsights.push({
        type: "forecast",
        message: `Based on current sales velocity, stock will deplete in ${daysRemaining} days.`,
        confidence: 88,
      });
    }
    
    items.push({
      id: i + 1,
      sku,
      name: `Product ${sku}`,
      variations: [
        { type: "Size", value: ["XS", "S", "M", "L", "XL"][i % 5] },
        { type: "Color", value: ["Black", "White", "Red", "Blue"][i % 4] },
      ],
      totalStock,
      avgDailySales: Math.round(avgDailySales * 10) / 10,
      daysRemaining,
      warningLevel,
      warehouses,
      replenishment: hasReplenishment
        ? {
            orderNumber: `PO-${Math.floor(Math.random() * 10000)}`,
            quantity: Math.floor(Math.random() * 200 + 100),
            expectedArrival: new Date(Date.now() + replenishmentArrival! * 24 * 60 * 60 * 1000)
              .toISOString()
              .split("T")[0],
            daysUntilArrival: replenishmentArrival!,
          }
        : undefined,
      history90Days,
      aiInsights,
    });
  }
  
  return items.sort((a, b) => {
    const priority = { critical: 0, warning: 1, reorder: 2, optimal: 3, healthy: 4 };
    return priority[a.warningLevel] - priority[b.warningLevel];
  });
}

const warningColors = {
  critical: { bg: "bg-red-500/10", border: "border-red-500", text: "text-red-500", badge: "bg-red-500" },
  warning: { bg: "bg-orange-500/10", border: "border-orange-500", text: "text-orange-500", badge: "bg-orange-500" },
  reorder: { bg: "bg-yellow-500/10", border: "border-yellow-500", text: "text-yellow-500", badge: "bg-yellow-500" },
  optimal: { bg: "bg-blue-500/10", border: "border-blue-500", text: "text-blue-500", badge: "bg-blue-500" },
  healthy: { bg: "bg-green-500/10", border: "border-green-500", text: "text-green-500", badge: "bg-green-500" },
};

const warningLabels = {
  critical: "Critical - Reorder Now",
  warning: "Warning - Cutting Close",
  reorder: "Reorder Recommended",
  optimal: "Optimal Reorder Point",
  healthy: "Healthy Stock",
};

export default function InventoryLive() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterWarning, setFilterWarning] = useState<string>("all");
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  
  const inventoryData = generateMockData();
  
  const filteredData = inventoryData.filter((item) => {
    const matchesSearch =
      item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterWarning === "all" || item.warningLevel === filterWarning;
    return matchesSearch && matchesFilter;
  });
  
  const toggleRow = (id: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-[1800px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Live Inventory Tracking
            </h1>
            <p className="text-slate-400 mt-2">
              Real-time stock levels with 90-day history, AI insights, and smart reorder warnings
            </p>
          </div>
          <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
        
        {/* Filters */}
        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm p-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by SKU or product name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-800/50 border-slate-700 text-white"
              />
            </div>
            <Select value={filterWarning} onValueChange={setFilterWarning}>
              <SelectTrigger className="w-[250px] bg-slate-800/50 border-slate-700 text-white">
                <SelectValue placeholder="Filter by warning level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="reorder">Reorder</SelectItem>
                <SelectItem value="optimal">Optimal</SelectItem>
                <SelectItem value="healthy">Healthy</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>
        
        {/* Inventory Table */}
        <div className="space-y-2">
          {filteredData.map((item) => {
            const isExpanded = expandedRows.has(item.id);
            const colors = warningColors[item.warningLevel];
            
            return (
              <Card
                key={item.id}
                className={`${colors.bg} border ${colors.border} backdrop-blur-sm overflow-hidden transition-all`}
              >
                {/* Main Row */}
                <div
                  className="p-4 cursor-pointer hover:bg-white/5 transition-colors"
                  onClick={() => toggleRow(item.id)}
                >
                  <div className="grid grid-cols-12 gap-4 items-center">
                    {/* Expand Icon */}
                    <div className="col-span-1 flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronDown className="h-5 w-5 text-slate-400" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-slate-400" />
                      )}
                    </div>
                    
                    {/* SKU & Product */}
                    <div className="col-span-3">
                      <div className="font-semibold text-white">{item.sku}</div>
                      <div className="text-sm text-slate-400">{item.name}</div>
                      {item.variations && (
                        <div className="flex gap-1 mt-1">
                          {item.variations.map((v, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {v.type}: {v.value}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {/* Total Stock */}
                    <div className="col-span-2">
                      <div className="text-2xl font-bold text-white">{item.totalStock}</div>
                      <div className="text-xs text-slate-400">Total Units</div>
                      {/* Warehouse breakdown */}
                      <div className="mt-2 space-y-1">
                        {item.warehouses.slice(0, 2).map((wh) => (
                          <div key={wh.id} className="text-xs text-slate-500">
                            └─ {wh.name}: {wh.stock} ({wh.percentage}%)
                          </div>
                        ))}
                        {item.warehouses.length > 2 && (
                          <div className="text-xs text-slate-500">
                            └─ +{item.warehouses.length - 2} more...
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Avg Daily Sales */}
                    <div className="col-span-2">
                      <div className="text-xl font-semibold text-cyan-400">{item.avgDailySales}</div>
                      <div className="text-xs text-slate-400">Units/Day</div>
                    </div>
                    
                    {/* Days Remaining */}
                    <div className="col-span-2">
                      <div className={`text-2xl font-bold ${colors.text}`}>{item.daysRemaining}</div>
                      <div className="text-xs text-slate-400">Days Left</div>
                    </div>
                    
                    {/* Warning Status */}
                    <div className="col-span-2">
                      <Badge className={`${colors.badge} text-white`}>
                        {warningLabels[item.warningLevel]}
                      </Badge>
                      {item.replenishment && (
                        <div className="text-xs text-slate-400 mt-1">
                          <Clock className="h-3 w-3 inline mr-1" />
                          Arriving in {item.replenishment.daysUntilArrival}d
                        </div>
                      )}
                      {!item.replenishment && item.warningLevel === "critical" && (
                        <div className="text-xs text-red-400 mt-1">
                          <AlertTriangle className="h-3 w-3 inline mr-1" />
                          No replenishment
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Expanded Section */}
                {isExpanded && (
                  <div className="border-t border-slate-700 p-4 bg-slate-900/30">
                    <div className="grid grid-cols-2 gap-6">
                      {/* 90-Day Graph */}
                      <div>
                        <h3 className="text-sm font-semibold text-white mb-3">90-Day Inventory History</h3>
                        <ResponsiveContainer width="100%" height={200}>
                          <AreaChart data={item.history90Days}>
                            <defs>
                              <linearGradient id={`gradient-${item.id}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis
                              dataKey="date"
                              stroke="#64748b"
                              tick={{ fontSize: 10 }}
                              tickFormatter={(value) => new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            />
                            <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                            <Tooltip
                              contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                              labelStyle={{ color: "#e2e8f0" }}
                            />
                            <ReferenceLine x={item.history90Days[30]?.date} stroke="#fbbf24" strokeDasharray="3 3" label={{ value: "60d", fill: "#fbbf24", fontSize: 10 }} />
                            <ReferenceLine x={item.history90Days[60]?.date} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: "30d", fill: "#f59e0b", fontSize: 10 }} />
                            <Area type="monotone" dataKey="quantity" stroke="#3b82f6" fill={`url(#gradient-${item.id})`} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                      
                      {/* AI Insights & Warehouse Details */}
                      <div className="space-y-4">
                        {/* AI Insights */}
                        {item.aiInsights.length > 0 && (
                          <div>
                            <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                              <Sparkles className="h-4 w-4 text-purple-400" />
                              AI Insights
                            </h3>
                            <div className="space-y-2">
                              {item.aiInsights.map((insight, idx) => (
                                <div key={idx} className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                                  <div className="flex items-start justify-between">
                                    <p className="text-sm text-slate-300">{insight.message}</p>
                                    <Badge variant="outline" className="text-xs ml-2">
                                      {insight.confidence}% confident
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Warehouse Breakdown */}
                        <div>
                          <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                            <Warehouse className="h-4 w-4 text-cyan-400" />
                            Warehouse Breakdown
                          </h3>
                          <div className="space-y-2">
                            {item.warehouses.map((wh) => (
                              <div key={wh.id} className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="font-medium text-white">{wh.name}</div>
                                    <div className="text-sm text-slate-400">{wh.stock} units ({wh.percentage}%)</div>
                                  </div>
                                  <div className="h-2 w-24 bg-slate-700 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
                                      style={{ width: `${wh.percentage}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        {/* Replenishment Info */}
                        {item.replenishment && (
                          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                            <h3 className="text-sm font-semibold text-blue-400 mb-2">Incoming Replenishment</h3>
                            <div className="text-sm text-slate-300">
                              <div>Order: {item.replenishment.orderNumber}</div>
                              <div>Quantity: {item.replenishment.quantity} units</div>
                              <div>Expected: {new Date(item.replenishment.expectedArrival).toLocaleDateString()}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
