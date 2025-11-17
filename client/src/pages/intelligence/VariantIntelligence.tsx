import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, Package, Search } from "lucide-react";

/**
 * Variant Intelligence Page
 * Per-variant readiness tracking and analysis
 */

export default function VariantIntelligence() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: products, isLoading } = trpc.intelligence.products.list.useQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  // Filter products with variants
  const productsWithVariants = (products || []).filter((p) => {
    const variantData = p.variantIntelligence as { variants?: any[] } | null;
    return variantData?.variants && variantData.variants.length > 0;
  });

  const filteredProducts = productsWithVariants.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Variant Intelligence</h1>
        <p className="text-muted-foreground mt-2">
          Per-variant readiness tracking and analysis
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

      {/* Products with Variants */}
      <div className="grid gap-6">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => {
            const variantData = product.variantIntelligence as { variants?: any[] } | null;
            const variants = variantData?.variants || [];
            const avgReadiness = variants.length > 0
              ? Math.round(variants.reduce((sum, v) => sum + (v.readinessScore || 0), 0) / variants.length)
              : 0;

            return (
              <Card key={product.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{product.name}</CardTitle>
                      <CardDescription>SKU: {product.sku} • {variants.length} variants</CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold">{avgReadiness}%</div>
                      <p className="text-xs text-muted-foreground">Avg Readiness</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {variants.map((variant: any, idx: number) => {
                      const readiness = variant.readinessScore || 0;
                      return (
                        <Card key={idx} className="border">
                          <CardContent className="pt-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <p className="font-semibold">{variant.name || `Variant ${idx + 1}`}</p>
                                <p className="text-xs text-muted-foreground">{variant.sku || "No SKU"}</p>
                              </div>
                              <Badge variant={readiness >= 90 ? "default" : readiness >= 70 ? "secondary" : "destructive"}>
                                {readiness}%
                              </Badge>
                            </div>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Images:</span>
                                <span>{variant.hasImages ? "✓" : "✗"}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Pricing:</span>
                                <span>{variant.hasPricing ? "✓" : "✗"}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Inventory:</span>
                                <span>{variant.hasInventory ? "✓" : "✗"}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Attributes:</span>
                                <span>{variant.hasAttributes ? "✓" : "✗"}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No products with variants found</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
