import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, Package, Search, AlertTriangle, CheckCircle } from "lucide-react";

/**
 * Inventory Intelligence Page
 * Stock level monitoring and launch readiness
 */

export default function InventoryIntelligence() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: products, isLoading } = trpc.intelligence.products.list.useQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const filteredProducts = (products || []).filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Inventory Intelligence</h1>
        <p className="text-muted-foreground mt-2">
          Stock level monitoring and launch readiness
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredProducts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">In Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {filteredProducts.filter((p) => {
                const meta = p.intelligenceMetadata as { inventoryStatus?: string } | null;
                return meta?.inventoryStatus === "in_stock";
              }).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {filteredProducts.filter((p) => {
                const meta = p.intelligenceMetadata as { inventoryStatus?: string } | null;
                return meta?.inventoryStatus === "low_stock";
              }).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {filteredProducts.filter((p) => {
                const meta = p.intelligenceMetadata as { inventoryStatus?: string } | null;
                return meta?.inventoryStatus === "out_of_stock";
              }).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Product List */}
      <div className="grid gap-4">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => {
            const meta = product.intelligenceMetadata as {
              inventoryStatus?: string;
              stockLevel?: number;
              reorderPoint?: number;
              leadTime?: number;
            } | null;

            const inventoryStatus = meta?.inventoryStatus || "unknown";
            const stockLevel = meta?.stockLevel || 0;
            const reorderPoint = meta?.reorderPoint || 0;
            const leadTime = meta?.leadTime || 0;

            const isLowStock = inventoryStatus === "low_stock";
            const isOutOfStock = inventoryStatus === "out_of_stock";

            return (
              <Card key={product.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-3">
                        {product.name}
                        {isOutOfStock ? (
                          <Badge variant="destructive" className="flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Out of Stock
                          </Badge>
                        ) : isLowStock ? (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Low Stock
                          </Badge>
                        ) : (
                          <Badge variant="default" className="flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            In Stock
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>SKU: {product.sku}</CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold">{stockLevel}</div>
                      <p className="text-xs text-muted-foreground">Units Available</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <p className="text-sm font-semibold">Reorder Point</p>
                      <p className="text-2xl font-bold">{reorderPoint}</p>
                      <p className="text-xs text-muted-foreground">units</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Lead Time</p>
                      <p className="text-2xl font-bold">{leadTime}</p>
                      <p className="text-xs text-muted-foreground">days</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Status</p>
                      <p className="text-lg font-semibold capitalize">{inventoryStatus.replace("_", " ")}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No products found</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
