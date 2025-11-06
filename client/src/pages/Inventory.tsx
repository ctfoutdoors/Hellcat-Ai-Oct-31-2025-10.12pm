import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Package, Search, AlertTriangle, RefreshCw, Loader2, Warehouse } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";

export default function Inventory() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: products, isLoading, refetch } = trpc.inventory.products.useQuery({});
  const { data: stats } = trpc.inventory.getInventoryStats.useQuery();

  const syncMutation = trpc.inventory.syncFromShipStation.useMutation({
    onSuccess: (result) => {
      toast.success("Inventory Sync Complete", {
        description: `Created: ${result.productsCreated}, Updated: ${result.productsUpdated}, Warehouses: ${result.warehousesFound.join(', ')}`,
      });
      refetch();
    },
    onError: (error) => {
      toast.error(`Sync failed: ${error.message}`);
    },
  });

  const allProducts = products?.products || [];
  
  // Filter by search term
  const filteredProducts = searchTerm
    ? allProducts.filter(p =>
        p.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : allProducts;

  const formatCurrency = (amount: string | number | null | undefined) => {
    if (!amount) return "$0.00";
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `$${num.toFixed(2)}`;
  };

  const getStockStatus = (quantity: number | null) => {
    const qty = quantity || 0;
    if (qty === 0) return { label: "Out of Stock", color: "bg-red-500/20 text-red-500" };
    if (qty < 10) return { label: "Low Stock", color: "bg-orange-500/20 text-orange-500" };
    if (qty < 50) return { label: "Medium Stock", color: "bg-yellow-500/20 text-yellow-500" };
    return { label: "In Stock", color: "bg-green-500/20 text-green-500" };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Package className="text-primary" size={32} />
            Inventory
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage product inventory from ShipStation warehouses
          </p>
        </div>
        <Button
          onClick={() => syncMutation.mutate()}
          disabled={syncMutation.isPending}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {syncMutation.isPending ? (
            <>
              <Loader2 className="mr-2 animate-spin" size={16} />
              Syncing Inventory...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2" size={16} />
              Sync from ShipStation
            </>
          )}
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="glass">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.totalProducts}</div>
              <p className="text-xs text-muted-foreground">Total Products</p>
            </CardContent>
          </Card>
          <Card className="glass">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{formatCurrency(stats.totalValue)}</div>
              <p className="text-xs text-muted-foreground">Total Inventory Value</p>
            </CardContent>
          </Card>
          <Card className="glass">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-orange-500">{stats.lowStock}</div>
              <p className="text-xs text-muted-foreground">Low Stock Items</p>
            </CardContent>
          </Card>
          <Card className="glass">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-500">{stats.outOfStock}</div>
              <p className="text-xs text-muted-foreground">Out of Stock</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search */}
      <Card className="glass">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
            <Input
              placeholder="Search by SKU or product name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card className="glass">
        <CardHeader>
          <CardTitle>Products ({filteredProducts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="animate-spin text-primary" size={32} />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package size={48} className="mx-auto mb-4 opacity-50" />
              <p>No products found. Click "Sync from ShipStation" to import inventory.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Product Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Margin</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Warehouse</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => {
                    const stockStatus = getStockStatus(product.quantity);
                    const productData = product.productData as any;
                    const warehouseInventory = productData?.warehouseInventory || [];
                    
                    return (
                      <TableRow key={product.id} className="hover:bg-muted/50">
                        <TableCell className="font-mono font-medium text-primary">
                          {product.sku}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{product.name}</div>
                        </TableCell>
                        <TableCell>
                          {product.category ? (
                            <Badge variant="outline">{product.category}</Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">Uncategorized</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-lg font-bold">{product.quantity || 0}</div>
                          {warehouseInventory.length > 1 && (
                            <div className="text-xs text-muted-foreground">
                              {warehouseInventory.length} warehouses
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{formatCurrency(product.cost)}</TableCell>
                        <TableCell className="font-medium">{formatCurrency(product.price)}</TableCell>
                        <TableCell>
                          {product.margin ? (
                            <Badge className="bg-green-500/20 text-green-500">
                              {product.margin}%
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={stockStatus.color}>
                            {stockStatus.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {warehouseInventory.length > 0 ? (
                            <div className="space-y-1">
                              {warehouseInventory.slice(0, 2).map((wh: any, idx: number) => (
                                <div key={idx} className="text-xs flex items-center gap-1">
                                  <Warehouse size={12} className="text-muted-foreground" />
                                  <span className="font-medium">{wh.warehouseName || `WH ${wh.warehouseId}`}:</span>
                                  <span className="text-primary">{wh.available || 0}</span>
                                </div>
                              ))}
                              {warehouseInventory.length > 2 && (
                                <div className="text-xs text-muted-foreground">
                                  +{warehouseInventory.length - 2} more
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">No warehouse data</span>
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
