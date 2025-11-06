import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Package,
  RefreshCw,
  Search,
  TrendingUp,
  Download,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  ShoppingCart,
  Globe,
  FileText,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { Line, Bar } from "recharts";
import { LineChart, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function OrderMonitoringEnhanced() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [channelFilter, setChannelFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("7days");
  const [selectedOrders, setSelectedOrders] = useState<Set<number>>(new Set());
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Fetch ShipStation orders
  const { data: ordersData, isLoading, refetch } = trpc.shipstation.listOrders.useQuery({
    orderStatus: statusFilter === "all" ? undefined : statusFilter,
    orderDateStart: getDateRangeStart(dateRange),
    pageSize: 100,
  });

  // Fetch stores/channels
  const { data: stores } = trpc.shipstation.listStores.useQuery({});

  // Mock analytics data (replace with real data from backend)
  const revenueData = [
    { date: "Mon", revenue: 2400, orders: 24 },
    { date: "Tue", revenue: 1398, orders: 18 },
    { date: "Wed", revenue: 9800, orders: 45 },
    { date: "Thu", revenue: 3908, orders: 32 },
    { date: "Fri", revenue: 4800, orders: 38 },
    { date: "Sat", revenue: 3800, orders: 29 },
    { date: "Sun", revenue: 4300, orders: 35 },
  ];

  const channelData = [
    { channel: "ShipStation", orders: 120, revenue: 24000 },
    { channel: "WooCommerce", orders: 85, revenue: 18500 },
    { channel: "Amazon", orders: 65, revenue: 15000 },
    { channel: "eBay", orders: 42, revenue: 9800 },
    { channel: "TikTok", orders: 28, revenue: 6200 },
  ];

  const handleRefresh = () => {
    toast.info("Refreshing orders...");
    refetch();
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(filteredOrders.map((o: any) => o.orderId));
      setSelectedOrders(allIds);
    } else {
      setSelectedOrders(new Set());
    }
  };

  const handleSelectOrder = (orderId: number, checked: boolean) => {
    const newSelected = new Set(selectedOrders);
    if (checked) {
      newSelected.add(orderId);
    } else {
      newSelected.delete(orderId);
    }
    setSelectedOrders(newSelected);
  };

  const handleBulkExport = () => {
    if (selectedOrders.size === 0) {
      toast.error("Please select orders to export");
      return;
    }
    toast.success(`Exporting ${selectedOrders.size} orders...`);
    // Implement export logic
  };

  const handleBulkCreateCases = () => {
    if (selectedOrders.size === 0) {
      toast.error("Please select orders to create cases");
      return;
    }
    toast.success(`Creating cases for ${selectedOrders.size} orders...`);
    // Implement case creation logic
  };

  const handleViewDetails = (order: any) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  const filteredOrders = ordersData?.orders?.filter((order: any) => {
    if (!searchQuery && channelFilter === "all") return true;
    
    const matchesSearch = !searchQuery || (
      order.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.trackingNumber?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const matchesChannel = channelFilter === "all" || order.advancedOptions?.source === channelFilter;

    return matchesSearch && matchesChannel;
  }) || [];

  // Detect problems
  const problemOrders = filteredOrders.filter((order: any) => {
    const shipDate = order.shipDate ? new Date(order.shipDate) : null;
    const now = new Date();
    const daysSinceShip = shipDate ? (now.getTime() - shipDate.getTime()) / (1000 * 60 * 60 * 24) : 0;
    
    return (
      order.orderStatus === "on_hold" ||
      order.orderStatus === "cancelled" ||
      (order.orderStatus === "awaiting_shipment" && daysSinceShip > 2) ||
      (order.orderStatus === "shipped" && daysSinceShip > 7)
    );
  });

  const totalRevenue = filteredOrders.reduce((sum: number, order: any) => sum + (order.orderTotal || 0), 0);
  const avgOrderValue = filteredOrders.length > 0 ? totalRevenue / filteredOrders.length : 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Order Monitoring</h1>
          <p className="text-muted-foreground">
            Track all orders from ShipStation and connected channels
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          {selectedOrders.size > 0 && (
            <>
              <Button variant="outline" onClick={handleBulkExport}>
                <Download className="h-4 w-4 mr-2" />
                Export ({selectedOrders.size})
              </Button>
              <Button onClick={handleBulkCreateCases}>
                <Plus className="h-4 w-4 mr-2" />
                Create Cases ({selectedOrders.size})
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredOrders.length}</div>
            <p className="text-xs text-muted-foreground">
              Last {dateRange === "7days" ? "7 days" : dateRange === "30days" ? "30 days" : "90 days"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(totalRevenue).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Total sales</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Order</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${avgOrderValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Per order</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Awaiting Ship</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredOrders.filter((o: any) => o.orderStatus === "awaiting_shipment").length}
            </div>
            <p className="text-xs text-muted-foreground">Ready to ship</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Shipped</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredOrders.filter((o: any) => o.orderStatus === "shipped").length}
            </div>
            <p className="text-xs text-muted-foreground">In transit</p>
          </CardContent>
        </Card>

        <Card className={problemOrders.length > 0 ? "border-orange-500" : ""}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Problems</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{problemOrders.length}</div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Dashboard */}
      <Tabs defaultValue="orders" className="space-y-4">
        <TabsList>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="channels">Channels</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-4">
          {/* Filters and Search */}
          <Card>
            <CardHeader>
              <CardTitle>Orders</CardTitle>
              <CardDescription>View and manage all orders from connected channels</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by order number, email, or tracking..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={channelFilter} onValueChange={setChannelFilter}>
                  <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue placeholder="All Channels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Channels</SelectItem>
                    <SelectItem value="shipstation">ShipStation</SelectItem>
                    <SelectItem value="woocommerce">WooCommerce</SelectItem>
                    <SelectItem value="amazon">Amazon</SelectItem>
                    <SelectItem value="ebay">eBay</SelectItem>
                    <SelectItem value="tiktok">TikTok Shop</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue placeholder="Order Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="awaiting_payment">Awaiting Payment</SelectItem>
                    <SelectItem value="awaiting_shipment">Awaiting Shipment</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue placeholder="Date Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7days">Last 7 Days</SelectItem>
                    <SelectItem value="30days">Last 30 Days</SelectItem>
                    <SelectItem value="90days">Last 90 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Orders Table */}
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedOrders.size === filteredOrders.length && filteredOrders.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Order #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Channel</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Carrier</TableHead>
                      <TableHead>Tracking</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                          Loading orders...
                        </TableCell>
                      </TableRow>
                    ) : filteredOrders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                          No orders found. Configure channel credentials in Settings to sync orders.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredOrders.map((order: any) => {
                        const isProblem = problemOrders.includes(order);
                        return (
                          <TableRow
                            key={order.orderId}
                            className={isProblem ? "bg-orange-50 dark:bg-orange-950/20" : ""}
                          >
                            <TableCell>
                              <Checkbox
                                checked={selectedOrders.has(order.orderId)}
                                onCheckedChange={(checked) => handleSelectOrder(order.orderId, checked as boolean)}
                              />
                            </TableCell>
                            <TableCell className="font-medium">{order.orderNumber}</TableCell>
                            <TableCell>{new Date(order.orderDate).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {getChannelIcon(order.advancedOptions?.source)} {getChannelName(order.advancedOptions?.source)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="text-sm">{order.customerEmail}</span>
                                <span className="text-xs text-muted-foreground">{order.customerUsername}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={getStatusVariant(order.orderStatus)}>
                                {formatStatus(order.orderStatus)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm">{order.carrierCode || "—"}</span>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm font-mono">{order.trackingNumber || "—"}</span>
                            </TableCell>
                            <TableCell className="text-right">
                              ${order.orderTotal?.toFixed(2) || "0.00"}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleViewDetails(order)}
                                >
                                  View
                                </Button>
                                {isProblem && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-orange-500 text-orange-500"
                                    onClick={() => toast.info("Creating case...")}
                                  >
                                    Create Case
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
                <CardDescription>Daily revenue over the past week</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Order Volume</CardTitle>
                <CardDescription>Daily orders over the past week</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="orders" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="channels" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Channel Performance</CardTitle>
              <CardDescription>Orders and revenue by sales channel</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={channelData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="channel" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="orders" fill="#10b981" />
                  <Bar yAxisId="right" dataKey="revenue" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stores?.map((store: any) => (
              <Card key={store.storeId}>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    {store.storeName}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant={store.active ? "default" : "secondary"}>
                        {store.active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Last Sync:</span>
                      <span>{store.modifyDate ? new Date(store.modifyDate).toLocaleString() : "Never"}</span>
                    </div>
                    <Button variant="outline" size="sm" className="w-full" onClick={handleRefresh}>
                      <RefreshCw className="h-3 w-3 mr-2" />
                      Sync Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Order Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details - {selectedOrder?.orderNumber}</DialogTitle>
            <DialogDescription>
              Complete information for this order
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Customer Information</h4>
                  <div className="space-y-1 text-sm">
                    <p><strong>Name:</strong> {selectedOrder.customerUsername}</p>
                    <p><strong>Email:</strong> {selectedOrder.customerEmail}</p>
                    <p><strong>Phone:</strong> {selectedOrder.billTo?.phone || "—"}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Order Information</h4>
                  <div className="space-y-1 text-sm">
                    <p><strong>Order Date:</strong> {new Date(selectedOrder.orderDate).toLocaleString()}</p>
                    <p><strong>Status:</strong> <Badge variant={getStatusVariant(selectedOrder.orderStatus)}>{formatStatus(selectedOrder.orderStatus)}</Badge></p>
                    <p><strong>Total:</strong> ${selectedOrder.orderTotal?.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Shipping Information</h4>
                <div className="space-y-1 text-sm">
                  <p><strong>Carrier:</strong> {selectedOrder.carrierCode || "—"}</p>
                  <p><strong>Service:</strong> {selectedOrder.serviceCode || "—"}</p>
                  <p><strong>Tracking:</strong> {selectedOrder.trackingNumber || "—"}</p>
                  <p><strong>Ship Date:</strong> {selectedOrder.shipDate ? new Date(selectedOrder.shipDate).toLocaleDateString() : "Not shipped"}</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Items</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SKU</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedOrder.items?.map((item: any, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell className="font-mono text-xs">{item.sku}</TableCell>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell className="text-right">${item.unitPrice?.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function getDateRangeStart(range: string): string {
  const now = new Date();
  const days = range === "7days" ? 7 : range === "30days" ? 30 : 90;
  const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  return start.toISOString();
}

function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "shipped":
      return "default";
    case "awaiting_shipment":
      return "secondary";
    case "cancelled":
      return "destructive";
    default:
      return "outline";
  }
}

function formatStatus(status: string): string {
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getChannelIcon(source: string): string {
  const icons: Record<string, string> = {
    shipstation: "🚢",
    woocommerce: "🛒",
    amazon: "📦",
    ebay: "🔨",
    tiktok: "🎵",
  };
  return icons[source?.toLowerCase()] || "📋";
}

function getChannelName(source: string): string {
  const names: Record<string, string> = {
    shipstation: "ShipStation",
    woocommerce: "WooCommerce",
    amazon: "Amazon",
    ebay: "eBay",
    tiktok: "TikTok",
  };
  return names[source?.toLowerCase()] || "Other";
}
