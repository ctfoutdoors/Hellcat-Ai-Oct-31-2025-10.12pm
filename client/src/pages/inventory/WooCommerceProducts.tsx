import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Download, RefreshCw, Package, AlertCircle, CheckCircle2, Loader2, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import DashboardLayout from "@/components/DashboardLayout";

export default function WooCommerceProducts() {
  const { user, loading: authLoading } = useAuth();
  const [importing, setImporting] = useState<number | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [expandedProducts, setExpandedProducts] = useState<Set<number>>(new Set());

  // Fetch WooCommerce products
  const { data: wooProducts, isLoading, refetch } = trpc.woocommerce.listProducts.useQuery();

  // Import product mutation
  const importProduct = trpc.woocommerce.importProduct.useMutation({
    onSuccess: () => {
      toast.success("Product imported successfully");
      setImporting(null);
      refetch();
    },
    onError: (error) => {
      toast.error(`Import failed: ${error.message}`);
      setImporting(null);
    },
  });

  // Update product mutation
  const updateProduct = trpc.woocommerce.updateProduct.useMutation({
    onSuccess: () => {
      toast.success("Product updated successfully");
      setImporting(null);
      refetch();
    },
    onError: (error) => {
      toast.error(`Update failed: ${error.message}`);
      setImporting(null);
    },
  });

  // Bulk import mutation
  const bulkImport = trpc.woocommerce.bulkImportProducts.useMutation({
    onSuccess: (data) => {
      toast.success(`Imported ${data.imported} products, ${data.failed} failed`);
      setSelectedProducts([]);
      refetch();
    },
    onError: (error) => {
      toast.error(`Bulk import failed: ${error.message}`);
    },
  });

  // Bulk update mutation
  const bulkUpdate = trpc.woocommerce.bulkUpdateProducts.useMutation({
    onSuccess: (data) => {
      toast.success(`Updated ${data.updated} products, ${data.failed} failed`);
      setSelectedProducts([]);
      refetch();
    },
    onError: (error) => {
      toast.error(`Bulk update failed: ${error.message}`);
    },
  });

  // Import variant mutation
  const importVariant = trpc.woocommerce.importVariant.useMutation({
    onSuccess: () => {
      toast.success("Variant imported successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(`Variant import failed: ${error.message}`);
    },
  });

  const handleImport = (productId: number) => {
    setImporting(productId);
    importProduct.mutate({ productId });
  };

  const handleUpdate = (productId: number) => {
    setImporting(productId);
    updateProduct.mutate({ productId });
  };

  const handleSelectAll = () => {
    if (!wooProducts) return;
    if (selectedProducts.length === wooProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(wooProducts.map((p: any) => p.id));
    }
  };

  const handleSelectProduct = (productId: number) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleBulkImport = () => {
    if (selectedProducts.length === 0) {
      toast.error("No products selected");
      return;
    }
    bulkImport.mutate({ productIds: selectedProducts });
  };

  const handleBulkUpdate = () => {
    if (selectedProducts.length === 0) {
      toast.error("No products selected");
      return;
    }
    bulkUpdate.mutate({ productIds: selectedProducts });
  };

  const toggleProductExpansion = (productId: number) => {
    setExpandedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const products = wooProducts || [];
  const importedCount = products.filter((p: any) => p.imported).length;
  const notImportedCount = products.length - importedCount;
  const hasChangesCount = products.filter((p: any) => p.hasChanges).length;

  if (authLoading || isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">WooCommerce Products</h1>
          <p className="text-muted-foreground mt-2">
            Import and sync products from your WooCommerce store
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Products
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{products.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Imported
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{importedCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Not Imported
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{notImportedCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Has Changes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{hasChangesCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Product List</CardTitle>
                <CardDescription>
                  Select products to import or update in bulk
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetch()}
                  disabled={isLoading}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleBulkImport}
                  disabled={selectedProducts.length === 0 || bulkImport.isPending}
                >
                  {bulkImport.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  Import Selected ({selectedProducts.length})
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleBulkUpdate}
                  disabled={selectedProducts.length === 0 || bulkUpdate.isPending}
                >
                  {bulkUpdate.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Update Selected ({selectedProducts.length})
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedProducts.length === products.length && products.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="w-12"></TableHead>
                  <TableHead className="w-20">Image</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Variations</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No products found
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((product: any) => (
                    <ProductRow
                      key={product.id}
                      product={product}
                      selected={selectedProducts.includes(product.id)}
                      expanded={expandedProducts.has(product.id)}
                      onSelect={() => handleSelectProduct(product.id)}
                      onToggleExpand={() => toggleProductExpansion(product.id)}
                      onImport={() => handleImport(product.id)}
                      onUpdate={() => handleUpdate(product.id)}
                      onImportVariant={(variationId) => 
                        importVariant.mutate({ productId: product.id, variationId })
                      }
                      importing={importing === product.id}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

// Product Row Component with Variant Support
function ProductRow({
  product,
  selected,
  expanded,
  onSelect,
  onToggleExpand,
  onImport,
  onUpdate,
  onImportVariant,
  importing,
}: {
  product: any;
  selected: boolean;
  expanded: boolean;
  onSelect: () => void;
  onToggleExpand: () => void;
  onImport: () => void;
  onUpdate: () => void;
  onImportVariant: (variationId: number) => void;
  importing: boolean;
}) {
  const hasVariations = product.variations && product.variations.length > 0;
  
  // Fetch variations when expanded
  const { data: variationsData, isLoading: loadingVariations } = trpc.woocommerce.getProductVariations.useQuery(
    { productId: product.id },
    { enabled: expanded && hasVariations }
  );

  return (
    <>
      <TableRow>
        <TableCell>
          <Checkbox checked={selected} onCheckedChange={onSelect} />
        </TableCell>
        <TableCell>
          {hasVariations && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={onToggleExpand}
            >
              {expanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          )}
        </TableCell>
        <TableCell>
          {product.images?.[0]?.src ? (
            <img
              src={product.images[0].src}
              alt={product.name}
              className="w-12 h-12 object-cover rounded"
            />
          ) : (
            <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
              <Package className="w-6 h-6 text-muted-foreground" />
            </div>
          )}
        </TableCell>
        <TableCell className="font-mono text-sm">{product.sku || "N/A"}</TableCell>
        <TableCell className="font-medium">{product.name}</TableCell>
        <TableCell>${product.price}</TableCell>
        <TableCell>
          {hasVariations && (
            <Badge variant="secondary">{product.variations.length} variants</Badge>
          )}
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            {product.imported ? (
              <Badge variant="default" className="gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Imported
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1">
                <AlertCircle className="w-3 h-3" />
                Not Imported
              </Badge>
            )}
            {product.hasChanges && (
              <Badge variant="outline" className="text-blue-600">
                Has Changes
              </Badge>
            )}
          </div>
        </TableCell>
        <TableCell className="text-right">
          {product.imported ? (
            <Button
              variant="outline"
              size="sm"
              onClick={onUpdate}
              disabled={importing}
            >
              {importing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Update"
              )}
            </Button>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={onImport}
              disabled={importing}
            >
              {importing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Import"
              )}
            </Button>
          )}
        </TableCell>
      </TableRow>
      
      {/* Variant Rows */}
      {expanded && hasVariations && (
        <TableRow>
          <TableCell colSpan={9} className="bg-muted/30 p-0">
            {loadingVariations ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="p-4">
                <h4 className="font-semibold mb-3 text-sm">Product Variations</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-20">Image</TableHead>
                      <TableHead>Variant SKU</TableHead>
                      <TableHead>Attributes</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {variationsData?.variations.map((variation: any) => (
                      <TableRow key={variation.id}>
                        <TableCell>
                          {variation.image?.src ? (
                            <img
                              src={variation.image.src}
                              alt={variation.sku}
                              className="w-10 h-10 object-cover rounded"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                              <Package className="w-5 h-5 text-muted-foreground" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {variation.sku || `VAR-${variation.id}`}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {variation.attributes?.map((attr: any, idx: number) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {attr.name}: {attr.option}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>${variation.price}</TableCell>
                        <TableCell>{variation.stock_quantity || 0}</TableCell>
                        <TableCell>
                          {variation.imported ? (
                            <Badge variant="default" className="text-xs">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Imported
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              Not Imported
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant={variation.imported ? "outline" : "default"}
                            size="sm"
                            onClick={() => onImportVariant(variation.id)}
                          >
                            {variation.imported ? "Update" : "Import"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
