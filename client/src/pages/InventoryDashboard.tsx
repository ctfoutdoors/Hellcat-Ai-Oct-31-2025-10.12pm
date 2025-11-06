import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  BarChart3,
  Box,
  DollarSign,
  Package,
  Search,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

export default function InventoryDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch inventory data
  const { data: inventoryData, isLoading } = trpc.inventory.overview.useQuery();
  const { data: locations } = trpc.inventory.locations.useQuery();

  if (authLoading || isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  const overview = inventoryData?.overview;
  const valuation = inventoryData?.valuation;
  const lowStock = inventoryData?.lowStock || [];
  const topProducts = inventoryData?.topProducts || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Inventory Management</h1>
            <p className="text-muted-foreground">Real-time inventory levels and analytics</p>
          </div>
          <div className="flex gap-2">
            <Link href="/inventory/products/new">
              <Button>
                <Package className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            </Link>
            <Link href="/inventory/adjust">
              <Button variant="outline">
                <ArrowUp className="mr-2 h-4 w-4" />
                Adjust Stock
              </Button>
            </Link>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Inventory Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${valuation?.total?.totalCost?.toLocaleString() || "0"}
              </div>
              <p className="text-xs text-muted-foreground">
                Retail: ${valuation?.total?.totalRetail?.toLocaleString() || "0"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Units</CardTitle>
              <Box className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {overview?.totalUnits?.toLocaleString() || "0"}
              </div>
              <p className="text-xs text-muted-foreground">
                {locations?.length || 0} locations
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">
                {overview?.lowStockCount || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Requires immediate attention
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Potential Profit</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">
                ${overview?.potentialProfit?.toLocaleString() || "0"}
              </div>
              <p className="text-xs text-muted-foreground">
                {valuation?.total?.totalCost
                  ? ((overview?.potentialProfit / valuation.total.totalCost) * 100).toFixed(1)
                  : "0"}
                % margin
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Inventory by Location */}
        <Card>
          <CardHeader>
            <CardTitle>Inventory by Location</CardTitle>
            <CardDescription>Stock distribution across warehouses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {valuation?.byLocation?.map((loc: any) => (
                <div key={loc.locationId} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Package className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{loc.locationName || "Unknown Location"}</p>
                      <p className="text-sm text-muted-foreground">
                        {loc.units?.toLocaleString() || 0} units
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${loc.totalValue?.toLocaleString() || "0"}</p>
                    <Link href={`/inventory/location/${loc.locationId}`}>
                      <Button variant="ghost" size="sm">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Low Stock Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Low Stock Alerts
              </CardTitle>
              <CardDescription>Products below reorder point</CardDescription>
            </CardHeader>
            <CardContent>
              {lowStock.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  All products are adequately stocked
                </p>
              ) : (
                <div className="space-y-3">
                  {lowStock.slice(0, 5).map((product: any) => (
                    <div key={product.productId} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          SKU: {product.sku} | Stock: {product.currentStock}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-orange-500 font-medium">
                          Reorder: {product.reorderQuantity}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {product.leadTimeDays || 7} days lead
                        </p>
                      </div>
                    </div>
                  ))}
                  {lowStock.length > 5 && (
                    <Link href="/inventory/low-stock">
                      <Button variant="ghost" size="sm" className="w-full">
                        View All ({lowStock.length})
                      </Button>
                    </Link>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Products by Value */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-500" />
                Top Products by Value
              </CardTitle>
              <CardDescription>Highest inventory value items</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topProducts.slice(0, 5).map((product: any, index: number) => (
                  <div key={product.productId} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                        <span className="text-sm font-bold text-blue-500">#{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium text-sm">{product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {product.totalQuantity} units @ ${product.cost}
                        </p>
                      </div>
                    </div>
                    <p className="font-semibold">${product.totalValue?.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Stock Movements */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Stock Movements</CardTitle>
            <CardDescription>Latest inventory changes</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overview?.recentMovements?.slice(0, 5).map((movement: any) => (
                  <TableRow key={movement.id}>
                    <TableCell className="text-sm">
                      {new Date(movement.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-medium ${
                          movement.quantity > 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {movement.quantity > 0 ? (
                          <ArrowUp className="h-3 w-3" />
                        ) : (
                          <ArrowDown className="h-3 w-3" />
                        )}
                        {movement.movementType}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">{movement.productId}</TableCell>
                    <TableCell className="text-sm font-medium">
                      {movement.quantity > 0 ? "+" : ""}
                      {movement.quantity}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {movement.notes || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Link href="/inventory/movements">
              <Button variant="ghost" size="sm" className="w-full mt-4">
                View All Movements
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
