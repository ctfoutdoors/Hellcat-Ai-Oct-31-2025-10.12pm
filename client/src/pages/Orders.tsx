import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Loader2, Search, ShoppingCart, RefreshCw, Package, Download } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

export default function Orders() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [channelFilter, setChannelFilter] = useState<string>("all");

  const { data: allOrders, isLoading, refetch } = trpc.orders.list.useQuery({
    source: sourceFilter !== "all" ? sourceFilter : undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    searchTerm: searchTerm || undefined,
  });

  const syncMutation = trpc.shipstation.syncOrders.useMutation({
    onSuccess: (result) => {
      toast.success("ShipStation Sync Complete", {
        description: `Created: ${result.ordersCreated}, Updated: ${result.ordersUpdated}, Processed: ${result.ordersProcessed}`,
      });
      refetch();
    },
    onError: (error) => {
      toast.error(`Sync failed: ${error.message}`);
    },
  });

  const shipmentSyncMutation = trpc.shipstation.syncShipments.useMutation({
    onSuccess: (result) => {
      toast.success("Shipment Matching Complete", {
        description: `Matched: ${result.ordersMatched}, Unmatched: ${result.ordersUnmatched}, Strategies: ${Object.keys(result.matchStrategies).join(', ')}`,
      });
      refetch();
    },
    onError: (error) => {
      toast.error(`Shipment sync failed: ${error.message}`);
    },
  });

  const orders = allOrders || [];
  
  // Filter by channel (client-side since it's a new field)
  const filteredOrders = channelFilter === "all" 
    ? orders 
    : orders.filter(o => {
        const orderData = o.orderData as any;
        const channel = orderData?.advancedOptions?.source || o.channel || 'Unknown';
        return channel === channelFilter;
      });

  // Extract unique channels
  const channels = Array.from(new Set(orders.map(o => {
    const orderData = o.orderData as any;
    return orderData?.advancedOptions?.source || o.channel || 'Unknown';
  })));

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      awaiting_shipment: "bg-yellow-500/20 text-yellow-500",
      shipped: "bg-blue-500/20 text-blue-500",
      cancelled: "bg-red-500/20 text-red-500",
      on_hold: "bg-orange-500/20 text-orange-500",
      delivered: "bg-green-500/20 text-green-500",
    };
    return colors[status] || "bg-gray-500/20 text-gray-500";
  };

  const getChannelColor = (channel: string) => {
    const colors: Record<string, string> = {
      Amazon: "bg-orange-500/20 text-orange-500",
      eBay: "bg-blue-500/20 text-blue-500",
      Shopify: "bg-green-500/20 text-green-500",
      Etsy: "bg-orange-600/20 text-orange-600",
      WooCommerce: "bg-purple-500/20 text-purple-500",
      BigCommerce: "bg-blue-600/20 text-blue-600",
    };
    return colors[channel] || "bg-gray-500/20 text-gray-500";
  };

  const formatCurrency = (amount: string | number | null | undefined) => {
    if (!amount) return "$0.00";
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `$${num.toFixed(2)}`;
  };

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <ShoppingCart className="text-primary" size={32} />
            Orders
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage and track all orders from ShipStation
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => syncMutation.mutate({ daysBack: 30 })}
            disabled={syncMutation.isPending || shipmentSyncMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {syncMutation.isPending ? (
              <>
                <Loader2 className="mr-2 animate-spin" size={16} />
                Syncing Orders...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2" size={16} />
                Sync Orders
              </>
            )}
          </Button>
          <Button
            onClick={() => shipmentSyncMutation.mutate({ daysBack: 30 })}
            disabled={syncMutation.isPending || shipmentSyncMutation.isPending}
            className="bg-green-600 hover:bg-green-700"
          >
            {shipmentSyncMutation.isPending ? (
              <>
                <Loader2 className="mr-2 animate-spin" size={16} />
                Matching Shipments...
              </>
            ) : (
              <>
                <Package className="mr-2" size={16} />
                Match Shipments
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{orders.length}</div>
            <p className="text-xs text-muted-foreground">Total Orders</p>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {orders.filter(o => o.status === 'awaiting_shipment').length}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting Shipment</p>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {orders.filter(o => o.status === 'shipped').length}
            </div>
            <p className="text-xs text-muted-foreground">Shipped</p>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {formatCurrency(orders.reduce((sum, o) => sum + parseFloat(o.totalAmount || '0'), 0))}
            </div>
            <p className="text-xs text-muted-foreground">Total Revenue</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="glass">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={channelFilter} onValueChange={setChannelFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Channels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Channels</SelectItem>
                {channels.map(channel => (
                  <SelectItem key={channel} value={channel}>{channel}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="awaiting_shipment">Awaiting Shipment</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="on_hold">On Hold</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Sources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="shipstation">ShipStation</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card className="glass">
        <CardHeader>
          <CardTitle>Orders List ({filteredOrders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="animate-spin text-primary" size={32} />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package size={48} className="mx-auto mb-4 opacity-50" />
              <p>No orders found. Click "Sync from ShipStation" to import orders.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tracking</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => {
                    const orderData = order.orderData as any;
                    const channel = orderData?.advancedOptions?.source || order.channel || 'Unknown';
                    const items = orderData?.items || [];
                    const trackingNumber = orderData?.trackingNumber || order.trackingNumber;
                    
                    return (
                      <TableRow key={order.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">
                          <Link href={`/orders/${order.id}`} className="text-primary hover:underline">
                            {order.orderNumber}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge className={getChannelColor(channel)}>
                            {channel}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{order.customerName}</div>
                            <div className="text-xs text-muted-foreground">{order.customerEmail}</div>
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(order.orderDate)}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {items.length} item{items.length !== 1 ? 's' : ''}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(order.totalAmount)}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(order.status || 'unknown')}>
                            {order.status?.replace('_', ' ') || 'Unknown'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {trackingNumber ? (
                            <div className="space-y-1">
                              <div className="text-xs font-mono text-primary font-medium">
                                {trackingNumber}
                              </div>
                              {order.carrierCode && (
                                <div className="flex items-center gap-1">
                                  <Badge variant="outline" className="text-xs">
                                    {order.carrierCode.toUpperCase()}
                                  </Badge>
                                  {order.shipDate && (
                                    <span className="text-xs text-muted-foreground">
                                      Shipped {formatDate(order.shipDate)}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">No tracking</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
