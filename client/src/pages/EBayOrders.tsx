import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Package, RefreshCw } from "lucide-react";
import { useLocation } from "wouter";

/**
 * eBay Orders Page
 * Displays orders from "New eBay Store" channel (Store ID: 2896008)
 */
export default function EBayOrders() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch orders filtered by eBay store
  const { data: orders, isLoading, refetch } = trpc.orders.list.useQuery({
    channel: "ebay",
    storeId: 2896008,
  });

  const filteredOrders = orders?.filter((order) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      order.orderNumber?.toLowerCase().includes(query) ||
      order.customerName?.toLowerCase().includes(query) ||
      order.trackingNumber?.toLowerCase().includes(query)
    );
  }) || [];

  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">eBay Orders</h1>
          <p className="text-muted-foreground">
            Orders from New eBay Store (Store ID: 2896008)
          </p>
        </div>
        <Button
          onClick={() => refetch()}
          variant="outline"
          size="sm"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Search and Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="md:col-span-3">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by order number, customer, or tracking..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredOrders.length}</div>
            <p className="text-xs text-muted-foreground">
              From eBay channel
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>eBay Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No eBay Orders Found</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                {searchQuery
                  ? "No orders match your search criteria. Try adjusting your search."
                  : "No orders from the New eBay Store channel yet."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-medium">Order #</th>
                    <th className="text-left p-4 font-medium">Customer</th>
                    <th className="text-left p-4 font-medium">Date</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-left p-4 font-medium">Carrier</th>
                    <th className="text-left p-4 font-medium">Tracking #</th>
                    <th className="text-left p-4 font-medium">Amount</th>
                    <th className="text-left p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="border-b hover:bg-muted/50">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{order.orderNumber}</span>
                          <Badge variant="outline" className="text-xs">
                            eBay
                          </Badge>
                        </div>
                      </td>
                      <td className="p-4">{order.customerName || "—"}</td>
                      <td className="p-4">
                        {order.orderDate
                          ? new Date(order.orderDate).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="p-4">
                        <Badge
                          variant={
                            order.status === "shipped"
                              ? "default"
                              : order.status === "processing"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {order.status || "pending"}
                        </Badge>
                      </td>
                      <td className="p-4">{order.carrier || "—"}</td>
                      <td className="p-4">
                        <span className="font-mono text-sm">
                          {order.trackingNumber || "—"}
                        </span>
                      </td>
                      <td className="p-4">
                        ${order.totalAmount?.toFixed(2) || "0.00"}
                      </td>
                      <td className="p-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setLocation(`/order/${order.id}`)}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
