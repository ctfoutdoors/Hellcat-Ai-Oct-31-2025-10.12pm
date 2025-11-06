import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  TrendingUp, 
  DollarSign, 
  Package, 
  ShoppingCart,
  Download,
  Calendar
} from "lucide-react";

export default function Analytics() {
  const [timeRange, setTimeRange] = useState("30d");

  // Mock data for charts
  const revenueData = [
    { month: "Jan", revenue: 125000, cases: 45 },
    { month: "Feb", revenue: 132000, cases: 52 },
    { month: "Mar", revenue: 148000, cases: 61 },
    { month: "Apr", revenue: 156000, cases: 58 },
    { month: "May", revenue: 171000, cases: 67 },
    { month: "Jun", revenue: 189000, cases: 74 },
  ];

  const caseStatusData = [
    { status: "Open", count: 34, color: "bg-blue-500" },
    { status: "Investigating", count: 28, color: "bg-yellow-500" },
    { status: "Resolved Won", count: 89, color: "bg-green-500" },
    { status: "Resolved Lost", count: 23, color: "bg-red-500" },
    { status: "Escalated", count: 12, color: "bg-orange-500" },
  ];

  const orderVolumeData = [
    { month: "Jan", orders: 1234 },
    { month: "Feb", orders: 1456 },
    { month: "Mar", orders: 1589 },
    { month: "Apr", orders: 1423 },
    { month: "May", orders: 1678 },
    { month: "Jun", orders: 1834 },
  ];

  const inventoryMetrics = [
    { metric: "Turnover Rate", value: "4.2x", trend: "+12%", positive: true },
    { metric: "Avg Days to Sell", value: "87 days", trend: "-8%", positive: true },
    { metric: "Stock Accuracy", value: "96.5%", trend: "+2%", positive: true },
    { metric: "Carrying Cost", value: "$45K", trend: "-5%", positive: true },
  ];

  const maxRevenue = Math.max(...revenueData.map(d => d.revenue));
  const maxOrders = Math.max(...orderVolumeData.map(d => d.orders));
  const totalCases = caseStatusData.reduce((sum, d) => sum + d.count, 0);

  const handleExport = () => {
    // TODO: Implement actual export functionality
    console.log("Exporting analytics data...");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive insights across all modules
          </p>
        </div>
        <div className="flex gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleExport} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$921K</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-green-500">+18.2%</span> from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Cases</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">186</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-green-500">+12</span> new this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">9,214</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-green-500">+23%</span> vs last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">79.5%</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-green-500">+3.2%</span> improvement
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Monthly revenue and case volume over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {revenueData.map((data, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{data.month}</span>
                    <div className="flex gap-4">
                      <span className="font-medium text-green-500">
                        ${(data.revenue / 1000).toFixed(0)}K
                      </span>
                      <span className="text-muted-foreground">
                        {data.cases} cases
                      </span>
                    </div>
                  </div>
                  <div className="relative h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="absolute h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all"
                      style={{ width: `${(data.revenue / maxRevenue) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Case Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Case Status Distribution</CardTitle>
            <CardDescription>Breakdown of cases by current status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Donut Chart Visualization */}
              <div className="flex items-center justify-center py-4">
                <div className="relative w-48 h-48">
                  <svg viewBox="0 0 100 100" className="transform -rotate-90">
                    {caseStatusData.reduce((acc, data, index) => {
                      const percentage = (data.count / totalCases) * 100;
                      const offset = acc.offset;
                      const color = data.color.replace('bg-', '');
                      acc.elements.push(
                        <circle
                          key={index}
                          cx="50"
                          cy="50"
                          r="40"
                          fill="none"
                          stroke={`currentColor`}
                          strokeWidth="20"
                          strokeDasharray={`${percentage * 2.51} ${251 - percentage * 2.51}`}
                          strokeDashoffset={-offset * 2.51}
                          className={`text-${color}`}
                        />
                      );
                      acc.offset += percentage;
                      return acc;
                    }, { elements: [] as JSX.Element[], offset: 0 }).elements}
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-3xl font-bold">{totalCases}</div>
                      <div className="text-xs text-muted-foreground">Total</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="space-y-2">
                {caseStatusData.map((data, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${data.color}`} />
                      <span className="text-sm">{data.status}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">{data.count}</span>
                      <span className="text-xs text-muted-foreground w-12 text-right">
                        {((data.count / totalCases) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Volume Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Order Volume</CardTitle>
            <CardDescription>Monthly order count trending upward</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end justify-between gap-2">
              {orderVolumeData.map((data, index) => (
                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full relative group">
                    <div
                      className="w-full bg-gradient-to-t from-purple-500 to-purple-400 rounded-t transition-all hover:from-purple-600 hover:to-purple-500"
                      style={{ height: `${(data.orders / maxOrders) * 200}px` }}
                    />
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-popover text-popover-foreground px-2 py-1 rounded text-xs font-medium whitespace-nowrap">
                        {data.orders.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{data.month}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Inventory Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Inventory Performance</CardTitle>
            <CardDescription>Key inventory health indicators</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {inventoryMetrics.map((metric, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                  <div>
                    <div className="text-sm text-muted-foreground">{metric.metric}</div>
                    <div className="text-2xl font-bold mt-1">{metric.value}</div>
                  </div>
                  <div className={`flex items-center gap-1 text-sm font-medium ${
                    metric.positive ? 'text-green-500' : 'text-red-500'
                  }`}>
                    <TrendingUp className={`h-4 w-4 ${!metric.positive && 'rotate-180'}`} />
                    {metric.trend}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
