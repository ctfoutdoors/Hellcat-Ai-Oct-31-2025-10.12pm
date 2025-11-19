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
import { Download, RefreshCw, Package, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";

export default function WooCommerceProducts() {
  const { user, loading: authLoading } = useAuth();
  const [importing, setImporting] = useState<number | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);

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

  const handleImport = (productId: number) => {
    setImporting(productId);
    importProduct.mutate({ productId });
  };

  const handleUpdate = (productId: number) => {
    setImporting(productId);
    updateProduct.mutate({ productId });
  };

  const handleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map((p: any) => p.id));
    }
  };

  const handleSelectProduct = (productId: number) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleImportAll = () => {
    const notImported = products.filter((p: any) => !p.imported).map((p: any) => p.id);
    if (notImported.length === 0) {
      toast.error("All products are already imported");
      return;
    }
    bulkImport.mutate({ productIds: notImported });
  };

  const handleUpdateAll = () => {
    const needsUpdate = products.filter((p: any) => p.hasChanges).map((p: any) => p.id);
    if (needsUpdate.length === 0) {
      toast.error("No products need updates");
      return;
    }
    bulkUpdate.mutate({ productIds: needsUpdate });
  };

  const handleBulkImport = () => {
    if (selectedProducts.length === 0) {
      toast.error("Please select products to import");
      return;
    }
    bulkImport.mutate({ productIds: selectedProducts });
  };

  const handleBulkUpdate = () => {
    if (selectedProducts.length === 0) {
      toast.error("Please select products to update");
      return;
    }
    bulkUpdate.mutate({ productIds: selectedProducts });
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const products = wooProducts || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">WooCommerce Product Source</h1>
          <p className="text-muted-foreground">
            Import and sync products from WooCommerce
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleImportAll}
            disabled={bulkImport.isPending || products.filter((p: any) => !p.imported).length === 0}
          >
            {bulkImport.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Import All ({products.filter((p: any) => !p.imported).length})
          </Button>
          <Button
            onClick={handleUpdateAll}
            disabled={bulkUpdate.isPending || products.filter((p: any) => p.hasChanges).length === 0}
          >
            {bulkUpdate.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Update All ({products.filter((p: any) => p.hasChanges).length})
          </Button>
          {selectedProducts.length > 0 && (
            <>
              <Button
                variant="outline"
                onClick={handleBulkImport}
                disabled={bulkImport.isPending}
              >
                <Download className="mr-2 h-4 w-4" />
                Import Selected ({selectedProducts.length})
              </Button>
              <Button
                variant="outline"
                onClick={handleBulkUpdate}
                disabled={bulkUpdate.isPending}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Update Selected ({selectedProducts.length})
              </Button>
            </>
          )}
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
            <p className="text-xs text-muted-foreground">
              Available in WooCommerce
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Imported</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {products.filter((p: any) => p.imported).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Synced to HellcatAI
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Needs Update</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {products.filter((p: any) => p.hasChanges).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Fields have changed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Products</CardTitle>
          <CardDescription>
            {products.length} products found in WooCommerce
          </CardDescription>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>No products found in WooCommerce</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedProducts.length === products.length && products.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Product Title</TableHead>
                  <TableHead>Variations</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product: any) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedProducts.includes(product.id)}
                        onCheckedChange={() => handleSelectProduct(product.id)}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {product.id}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {product.sku || <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{product.name}</div>
                      {product.hasChanges && (
                        <div className="text-xs text-yellow-600 mt-1">
                          Fields changed: {product.changedFields?.join(", ")}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {product.variations && product.variations.length > 0 ? (
                        <Badge variant="outline">
                          {product.variations.length} variation{product.variations.length > 1 ? "s" : ""}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">Simple</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      ${Number(product.price || 0).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {product.imported ? (
                        product.hasChanges ? (
                          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                            Needs Update
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                            Synced
                          </Badge>
                        )
                      ) : (
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">
                          Not Imported
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {product.imported ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdate(product.id)}
                          disabled={importing === product.id || !product.hasChanges}
                        >
                          {importing === product.id ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <RefreshCw className="mr-2 h-4 w-4" />
                              Update
                            </>
                          )}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleImport(product.id)}
                          disabled={importing === product.id}
                        >
                          {importing === product.id ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Download className="mr-2 h-4 w-4" />
                              Import
                            </>
                          )}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
