import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Package,
  DollarSign,
  Warehouse,
  TrendingUp,
  Factory,
  Tag,
  Image as ImageIcon,
  Info,
  BarChart3,
  Users,
  Box,
} from 'lucide-react';

interface ProductVariation {
  id: number;
  sku: string;
  name: string;
  price: number;
  salePrice?: number;
  stock: number;
  attributes: Record<string, string>;
}

interface ProductCardProps {
  product: {
    id: number;
    sku: string;
    upc?: string;
    productId?: string;
    name: string;
    description?: string;
    category?: string;
    price?: number;
    salePrice?: number;
    cost?: number;
    weight?: number;
    length?: number;
    width?: number;
    height?: number;
    imageUrl?: string;
    images?: string[];
    active?: boolean;
    tags?: string[];
    attributes?: Record<string, any>;
    metadata?: Record<string, any>;
    // Inventory data
    totalStock?: number;
    warehouseStock?: Array<{
      warehouseName: string;
      quantity: number;
      reserved: number;
    }>;
    reorderPoint?: number;
    // Sales data
    totalSales?: number;
    revenue?: number;
    avgDailySales?: number;
    // Supplier data
    vendors?: Array<{
      id: number;
      name: string;
      cost: number;
      leadTime: number;
    }>;
    // Variations
    variations?: ProductVariation[];
    isVariable?: boolean;
  };
  onEdit?: () => void;
  onDelete?: () => void;
}

export function ProductCard({ product, onEdit, onDelete }: ProductCardProps) {
  const [activeTab, setActiveTab] = useState('overview');

  // Format currency
  const formatCurrency = (cents: number | undefined) => {
    if (!cents) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  // Format weight
  const formatWeight = (oz: number | undefined) => {
    if (!oz) return 'N/A';
    if (oz >= 16) {
      return `${(oz / 16).toFixed(2)} lbs`;
    }
    return `${oz} oz`;
  };

  // Format dimensions
  const formatDimensions = () => {
    if (!product.length || !product.width || !product.height) return 'N/A';
    return `${product.length}" × ${product.width}" × ${product.height}"`;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              {product.name}
              {!product.active && <Badge variant="secondary">Inactive</Badge>}
              {product.isVariable && <Badge variant="outline">Variable</Badge>}
            </CardTitle>
            <div className="mt-2 space-y-1 text-sm text-muted-foreground">
              <div className="flex gap-4">
                <span><strong>SKU:</strong> {product.sku}</span>
                {product.upc && <span><strong>UPC:</strong> {product.upc}</span>}
                {product.productId && <span><strong>Product ID:</strong> {product.productId}</span>}
              </div>
              {product.category && (
                <div className="flex items-center gap-2">
                  <Tag className="h-3 w-3" />
                  <span>{product.category}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {onEdit && (
              <Button variant="outline" size="sm" onClick={onEdit}>
                Edit
              </Button>
            )}
            {onDelete && (
              <Button variant="destructive" size="sm" onClick={onDelete}>
                Delete
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">
              <Info className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="details">
              <Box className="h-4 w-4 mr-2" />
              Details
            </TabsTrigger>
            <TabsTrigger value="inventory">
              <Warehouse className="h-4 w-4 mr-2" />
              Inventory
            </TabsTrigger>
            <TabsTrigger value="sales">
              <BarChart3 className="h-4 w-4 mr-2" />
              Sales
            </TabsTrigger>
            <TabsTrigger value="suppliers">
              <Factory className="h-4 w-4 mr-2" />
              Suppliers
            </TabsTrigger>
            {product.isVariable && (
              <TabsTrigger value="variations">
                <Package className="h-4 w-4 mr-2" />
                Variations
              </TabsTrigger>
            )}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Product Image */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Product Image</h3>
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-48 object-cover rounded-lg border"
                  />
                ) : (
                  <div className="w-full h-48 bg-muted rounded-lg border flex items-center justify-center">
                    <ImageIcon className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Quick Stats */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Pricing</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="text-xs text-muted-foreground">Regular Price</div>
                      <div className="text-lg font-bold text-green-600">
                        {formatCurrency(product.price)}
                      </div>
                    </div>
                    {product.salePrice && (
                      <div className="p-3 bg-muted rounded-lg">
                        <div className="text-xs text-muted-foreground">Sale Price</div>
                        <div className="text-lg font-bold text-orange-600">
                          {formatCurrency(product.salePrice)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Stock Status</h3>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-xs text-muted-foreground">Available Stock</div>
                    <div className="text-2xl font-bold">
                      {product.totalStock || 0} units
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-4">
            {/* Description */}
            {product.description && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Description</h3>
                <p className="text-sm text-muted-foreground">{product.description}</p>
              </div>
            )}

            {/* Attributes */}
            {product.attributes && Object.keys(product.attributes).length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Attributes</h3>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(product.attributes).map(([key, value]) => (
                    <div key={key} className="p-2 bg-muted rounded">
                      <div className="text-xs text-muted-foreground">{key}</div>
                      <div className="text-sm font-medium">{String(value)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dimensions & Weight */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Dimensions & Weight</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 bg-muted rounded">
                  <div className="text-xs text-muted-foreground">Dimensions (L×W×H)</div>
                  <div className="text-sm font-medium">{formatDimensions()}</div>
                </div>
                <div className="p-2 bg-muted rounded">
                  <div className="text-xs text-muted-foreground">Weight</div>
                  <div className="text-sm font-medium">{formatWeight(product.weight)}</div>
                </div>
              </div>
            </div>

            {/* Metadata */}
            {product.metadata && Object.keys(product.metadata).length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Metadata</h3>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(product.metadata).map(([key, value]) => (
                    <div key={key} className="p-2 bg-muted rounded">
                      <div className="text-xs text-muted-foreground">{key}</div>
                      <div className="text-sm font-medium">{String(value)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Inventory Tab */}
          <TabsContent value="inventory" className="space-y-4">
            {/* Total Stock */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-xs text-muted-foreground">Total Stock</div>
                <div className="text-2xl font-bold">{product.totalStock || 0}</div>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-xs text-muted-foreground">Reorder Point</div>
                <div className="text-2xl font-bold">{product.reorderPoint || 'N/A'}</div>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-xs text-muted-foreground">Status</div>
                <div className="text-lg font-bold">
                  {(product.totalStock || 0) > (product.reorderPoint || 0) ? (
                    <Badge variant="default">In Stock</Badge>
                  ) : (
                    <Badge variant="destructive">Low Stock</Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Warehouse Breakdown */}
            {product.warehouseStock && product.warehouseStock.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Warehouse Breakdown</h3>
                <div className="space-y-2">
                  {product.warehouseStock.map((warehouse, index) => (
                    <div key={index} className="p-3 bg-muted rounded-lg flex justify-between items-center">
                      <div>
                        <div className="font-medium">{warehouse.warehouseName}</div>
                        <div className="text-xs text-muted-foreground">
                          Reserved: {warehouse.reserved}
                        </div>
                      </div>
                      <div className="text-xl font-bold">{warehouse.quantity}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Sales Tab */}
          <TabsContent value="sales" className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-xs text-muted-foreground">Total Sales</div>
                <div className="text-2xl font-bold">{product.totalSales || 0}</div>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-xs text-muted-foreground">Revenue</div>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(product.revenue)}
                </div>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-xs text-muted-foreground">Avg Daily Sales</div>
                <div className="text-2xl font-bold">
                  {product.avgDailySales?.toFixed(1) || '0'}
                </div>
              </div>
            </div>

            {/* Placeholder for sales chart */}
            <div className="p-8 bg-muted rounded-lg text-center text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-2" />
              <p>Sales history chart coming soon</p>
            </div>
          </TabsContent>

          {/* Suppliers Tab */}
          <TabsContent value="suppliers" className="space-y-4">
            {product.vendors && product.vendors.length > 0 ? (
              <div className="space-y-2">
                {product.vendors.map((vendor) => (
                  <div key={vendor.id} className="p-4 bg-muted rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{vendor.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Lead Time: {vendor.leadTime} days
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600">
                          {formatCurrency(vendor.cost)}
                        </div>
                        <div className="text-xs text-muted-foreground">Cost</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 bg-muted rounded-lg text-center text-muted-foreground">
                <Factory className="h-12 w-12 mx-auto mb-2" />
                <p>No suppliers linked to this product</p>
                <Button variant="outline" className="mt-4">
                  Add Supplier
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Variations Tab */}
          {product.isVariable && (
            <TabsContent value="variations" className="space-y-4">
              {product.variations && product.variations.length > 0 ? (
                <div className="space-y-2">
                  {product.variations.map((variation) => (
                    <div key={variation.id} className="p-4 bg-muted rounded-lg">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium">{variation.name}</div>
                          <div className="text-sm text-muted-foreground">
                            SKU: {variation.sku}
                          </div>
                          <div className="flex gap-2 mt-2">
                            {Object.entries(variation.attributes).map(([key, value]) => (
                              <Badge key={key} variant="outline">
                                {key}: {value}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">
                            {formatCurrency(variation.salePrice || variation.price)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Stock: {variation.stock}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 bg-muted rounded-lg text-center text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-2" />
                  <p>No variations defined for this product</p>
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
}
