import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Edit,
  Package,
  DollarSign,
  TrendingUp,
  Image as ImageIcon,
} from "lucide-react";
import { useLocation } from "wouter";

export default function ProductCard() {
  const [, params] = useRoute("/inventory/products/:id");
  const [, setLocation] = useLocation();
  const productId = parseInt(params?.id || "0");

  // Mock data - replace with actual tRPC query
  const product = {
    id: productId,
    sku: "PROD-001",
    name: "Premium Fishing Line",
    category: "Fishing Gear",
    type: "variable",
    status: "active",
    description: "High-quality braided fishing line for professional anglers",
    images: [
      "https://via.placeholder.com/400x400",
      "https://via.placeholder.com/400x400",
    ],
    regularPrice: 29.99,
    salePrice: 24.99,
    costPrice: 15.00,
    stockQuantity: 150,
    lowStockThreshold: 20,
    woocommerceId: 12345,
    upc: "123456789012",
    weight: 0.5,
    dimensions: "10x5x2",
    variations: [
      {
        id: 1,
        sku: "PROD-001-10LB",
        name: "10lb Test",
        regularPrice: 24.99,
        salePrice: 19.99,
        stockQuantity: 50,
      },
      {
        id: 2,
        sku: "PROD-001-20LB",
        name: "20lb Test",
        regularPrice: 29.99,
        salePrice: 24.99,
        stockQuantity: 75,
      },
      {
        id: 3,
        sku: "PROD-001-30LB",
        name: "30lb Test",
        regularPrice: 34.99,
        salePrice: 29.99,
        stockQuantity: 25,
      },
    ],
    analytics: {
      totalSold: 450,
      revenue: 11250,
      avgOrderValue: 25,
      topChannel: "WooCommerce",
    },
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/inventory/products")}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <Package className="w-6 h-6" />
              <h1 className="text-3xl font-bold">{product.name}</h1>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-muted-foreground">SKU: {product.sku}</span>
              <Badge variant={product.status === "active" ? "default" : "secondary"}>
                {product.status}
              </Badge>
              {product.type === "variable" && (
                <Badge variant="outline">Variable Product</Badge>
              )}
            </div>
          </div>
        </div>
        <Button>
          <Edit className="w-4 h-4 mr-2" />
          Edit Product
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Stock Level
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{product.stockQuantity}</div>
            <div className="text-xs text-muted-foreground">
              Low stock: {product.lowStockThreshold}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Sale Price
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${product.salePrice}</div>
            <div className="text-xs text-muted-foreground line-through">
              ${product.regularPrice}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Sold
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{product.analytics.totalSold}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${product.analytics.revenue.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="variations">
            Variations ({product.variations.length})
          </TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Product Information */}
            <Card>
              <CardHeader>
                <CardTitle>Product Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-sm text-muted-foreground">Category</div>
                  <div className="font-medium">{product.category}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Description</div>
                  <div className="text-sm">{product.description}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">UPC</div>
                  <div className="font-mono text-sm">{product.upc}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">WooCommerce ID</div>
                  <div className="font-mono text-sm">{product.woocommerceId}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Dimensions</div>
                  <div className="text-sm">
                    {product.dimensions} • {product.weight} lbs
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Product Images */}
            <Card>
              <CardHeader>
                <CardTitle>Product Images</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {product.images.map((image, index) => (
                    <div
                      key={index}
                      className="aspect-square rounded-lg border overflow-hidden"
                    >
                      <img
                        src={image}
                        alt={`Product ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Variations Tab */}
        <TabsContent value="variations">
          <Card>
            <CardHeader>
              <CardTitle>Product Variations</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Regular Price</TableHead>
                    <TableHead>Sale Price</TableHead>
                    <TableHead>Stock</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {product.variations.map((variation) => (
                    <TableRow key={variation.id}>
                      <TableCell className="font-mono text-sm">
                        {variation.sku}
                      </TableCell>
                      <TableCell>{variation.name}</TableCell>
                      <TableCell>${variation.regularPrice}</TableCell>
                      <TableCell className="font-medium">
                        ${variation.salePrice}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            variation.stockQuantity > 20 ? "default" : "destructive"
                          }
                        >
                          {variation.stockQuantity}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pricing Tab */}
        <TabsContent value="pricing">
          <Card>
            <CardHeader>
              <CardTitle>Pricing Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">
                    Cost Price
                  </div>
                  <div className="text-2xl font-bold">${product.costPrice}</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">
                    Regular Price
                  </div>
                  <div className="text-2xl font-bold">${product.regularPrice}</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">
                    Sale Price
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    ${product.salePrice}
                  </div>
                </div>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm font-medium mb-2">Profit Margins</div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">
                      Regular Margin
                    </div>
                    <div className="text-lg font-bold">
                      {(
                        ((product.regularPrice - product.costPrice) /
                          product.regularPrice) *
                        100
                      ).toFixed(1)}
                      %
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Sale Margin</div>
                    <div className="text-lg font-bold">
                      {(
                        ((product.salePrice - product.costPrice) / product.salePrice) *
                        100
                      ).toFixed(1)}
                      %
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inventory Tab */}
        <TabsContent value="inventory">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">
                    Current Stock
                  </div>
                  <div className="text-3xl font-bold">{product.stockQuantity}</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">
                    Low Stock Alert
                  </div>
                  <div className="text-3xl font-bold">
                    {product.lowStockThreshold}
                  </div>
                </div>
              </div>
              {product.stockQuantity <= product.lowStockThreshold && (
                <div className="p-4 bg-destructive/10 border border-destructive rounded-lg">
                  <div className="font-medium text-destructive">
                    ⚠️ Low Stock Alert
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Stock level is below threshold. Consider reordering.
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Sales Analytics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">
                    Total Units Sold
                  </div>
                  <div className="text-2xl font-bold">
                    {product.analytics.totalSold}
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">
                    Total Revenue
                  </div>
                  <div className="text-2xl font-bold">
                    ${product.analytics.revenue.toLocaleString()}
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">
                    Avg Order Value
                  </div>
                  <div className="text-2xl font-bold">
                    ${product.analytics.avgOrderValue}
                  </div>
                </div>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm font-medium mb-2">Top Sales Channel</div>
                <div className="text-lg font-bold">
                  {product.analytics.topChannel}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
