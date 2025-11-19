import { useAuth } from "@/_core/hooks/useAuth";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { trpc } from "@/lib/trpc";
import {
  Package,
  Plus,
  Search,
  Edit,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  DollarSign,
  Barcode,
  Info,
} from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";

export default function ProductsManagement() {
  const { user, loading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const limit = 20;

  // Fetch products
  const { data: productsData, isLoading } = trpc.inventory.products.useQuery({
    page,
    limit,
    category: categoryFilter !== "all" ? categoryFilter : undefined,
  });

  // Search products
  const { data: searchResults, refetch: searchProducts } = trpc.inventory.searchProducts.useQuery(
    { query: searchQuery, limit: 10 },
    { enabled: false }
  );

  // getProducts returns array directly, not { products: [] }
  const products = productsData || [];
  const categories = ["all", "electronics", "apparel", "accessories", "supplies", "other"];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      searchProducts();
    }
  };

  // Calculate stats
  const totalProducts = products.length;
  const totalValue = products.reduce((sum: number, p: any) => {
    const cost = Number(p.manualCost || p.shipstationCost || p.cost) || 0;
    const stock = p.totalStock || 0;
    return sum + (cost * stock);
  }, 0);
  const avgMargin = products.length > 0
    ? products.reduce((sum: number, p: any) => {
        const cost = Number(p.manualCost || p.shipstationCost || p.cost) || 0;
        const price = Number(p.price) || 0;
        const margin = price > 0 ? ((price - cost) / price * 100) : 0;
        return sum + margin;
      }, 0) / products.length
    : 0;
  const lowStockCount = products.filter((p: any) => (p.totalStock || 0) < 10).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Products Management</h1>
            <p className="text-muted-foreground">Manage your inventory products and SKUs</p>
          </div>
          <Link href="/inventory/products/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                Total Products
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalProducts}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                Total Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalValue.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                Avg Margin
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgMargin.toFixed(1)}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                Low Stock
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{lowStockCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <form onSubmit={handleSearch} className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by SKU, name, or barcode..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </form>

              {/* Category Filter */}
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Products Table */}
        <Card>
          <CardHeader>
            <CardTitle>Product Inventory</CardTitle>
            <CardDescription>
              View and manage all products with pricing, cost, and stock information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Image</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      Cost
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Manual cost → ShipStation cost → Base cost</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </TableHead>
                  <TableHead className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      Price
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Public price (role-based pricing available)</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Margin</TableHead>
                  <TableHead className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      Stock
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Hover for channel breakdown</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product: any) => {
                  // Cost priority: manual → shipstation → base
                  const cost = Number(product.manualCost || product.shipstationCost || product.cost) || 0;
                  const price = Number(product.price) || 0;
                  const margin = price > 0 ? ((price - cost) / price * 100) : 0;
                  const totalStock = product.totalStock || 0;
                  const isLowStock = totalStock < 10;

                  return (
                    <TableRow key={product.id}>
                      <TableCell>
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                            <Package className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Barcode className="h-4 w-4 text-muted-foreground" />
                          <span className="font-mono text-sm">{product.sku}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium max-w-xs truncate">
                        {product.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {product.category || "Uncategorized"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        <div className="flex flex-col items-end">
                          <span>${cost.toFixed(2)}</span>
                          {product.manualCost && (
                            <Badge variant="secondary" className="text-xs mt-1">Manual</Badge>
                          )}
                          {!product.manualCost && product.shipstationCost && (
                            <Badge variant="outline" className="text-xs mt-1">ShipStation</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        ${price.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {margin > 30 ? (
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          ) : margin < 15 ? (
                            <TrendingDown className="h-4 w-4 text-red-600" />
                          ) : null}
                          <span className={
                            margin > 30 ? "text-green-600 font-semibold" :
                            margin < 15 ? "text-red-600 font-semibold" :
                            "font-semibold"
                          }>
                            {margin.toFixed(1)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className={`inline-flex items-center gap-1 cursor-help ${
                                isLowStock ? "text-orange-600 font-semibold" : ""
                              }`}>
                                {isLowStock && <AlertTriangle className="h-4 w-4" />}
                                <span>{totalStock}</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <div className="space-y-2">
                                <p className="font-semibold">Channel Breakdown</p>
                                <div className="space-y-1 text-sm">
                                  <div className="flex justify-between gap-4">
                                    <span>ShipStation:</span>
                                    <span className="font-mono">{totalStock}</span>
                                  </div>
                                  <div className="flex justify-between gap-4 text-muted-foreground">
                                    <span>WooCommerce:</span>
                                    <span className="font-mono">-</span>
                                  </div>
                                  <div className="flex justify-between gap-4 text-muted-foreground">
                                    <span>Amazon:</span>
                                    <span className="font-mono">-</span>
                                  </div>
                                  <div className="flex justify-between gap-4 text-muted-foreground">
                                    <span>TikTok:</span>
                                    <span className="font-mono">-</span>
                                  </div>
                                  <div className="flex justify-between gap-4 text-muted-foreground">
                                    <span>eBay:</span>
                                    <span className="font-mono">-</span>
                                  </div>
                                </div>
                                <p className="text-xs text-muted-foreground pt-2 border-t">
                                  Configure channel-specific stock in Stock Levels
                                </p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/inventory/products/${product.id}`}>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {products.length === 0 && (
              <div className="text-center py-12">
                <Package className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No products found</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Get started by adding your first product
                </p>
                <Link href="/inventory/products/new">
                  <Button className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Product
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
