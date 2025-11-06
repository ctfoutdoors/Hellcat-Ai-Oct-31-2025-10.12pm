import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Package, 
  Search, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  BarChart3,
  MapPin,
  RefreshCw,
  Download
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';

export default function Inventory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');

  const { data: inventoryData, isLoading } = trpc.inventory.list.useQuery({});
  const { data: lowStockData } = trpc.inventory.getLowStock.useQuery();
  const { data: statsData } = trpc.inventory.getDashboardStats.useQuery();
  const { data: valuationData } = trpc.inventory.getValuation.useQuery({});

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
            <p className="text-muted-foreground mt-2">
              Track stock levels, valuations, and inventory movements
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Sync
            </Button>
          </div>
        </div>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(statsData?.stats.totalValue || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                {statsData?.stats.totalItems || 0} items in stock
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statsData?.stats.totalProducts || 0}</div>
              <p className="text-xs text-muted-foreground">
                Active SKUs
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">
                {statsData?.stats.lowStockCount || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {statsData?.stats.outOfStockCount || 0} out of stock
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Turnover Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statsData?.stats.turnoverRate || 0}x</div>
              <p className="text-xs text-muted-foreground">
                Avg {statsData?.stats.avgDaysToSell || 0} days to sell
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Valuation Methods */}
        <Card>
          <CardHeader>
            <CardTitle>Inventory Valuation</CardTitle>
            <CardDescription>Compare different valuation methods</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">FIFO (First In, First Out)</div>
                <div className="text-2xl font-bold">
                  {formatCurrency(valuationData?.valuation.fifo || 0)}
                </div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">LIFO (Last In, First Out)</div>
                <div className="text-2xl font-bold">
                  {formatCurrency(valuationData?.valuation.lifo || 0)}
                </div>
              </div>
              <div className="p-4 border rounded-lg bg-primary/5">
                <div className="text-sm text-muted-foreground mb-1">Weighted Average</div>
                <div className="text-2xl font-bold text-primary">
                  {formatCurrency(valuationData?.valuation.weightedAverage || 0)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">Currently using</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for different views */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All Inventory</TabsTrigger>
            <TabsTrigger value="low-stock">
              Low Stock
              {lowStockData && lowStockData.items.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {lowStockData.items.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="aging">Aging Report</TabsTrigger>
          </TabsList>

          {/* All Inventory Tab */}
          <TabsContent value="all" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Inventory List</CardTitle>
                    <CardDescription>
                      {inventoryData?.total || 0} products in inventory
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by SKU or name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <select
                      value={selectedLocation}
                      onChange={(e) => setSelectedLocation(e.target.value)}
                      className="px-4 py-2 border rounded-md"
                    >
                      <option value="all">All Locations</option>
                      <option value="warehouse-a">Warehouse A</option>
                      <option value="warehouse-b">Warehouse B</option>
                    </select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading...</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>SKU</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead className="text-right">On Hand</TableHead>
                        <TableHead className="text-right">Allocated</TableHead>
                        <TableHead className="text-right">Available</TableHead>
                        <TableHead className="text-right">On Order</TableHead>
                        <TableHead className="text-right">Avg Cost</TableHead>
                        <TableHead className="text-right">Total Value</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inventoryData?.inventory && inventoryData.inventory.length > 0 ? (
                        inventoryData.inventory.map((item: any) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                            <TableCell>{item.productName}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-muted-foreground" />
                                <span className="text-sm">{item.warehouseLocation || 'N/A'}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {item.quantityOnHand}
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground">
                              {item.quantityAllocated}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {item.quantityAvailable}
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground">
                              {item.quantityOnOrder}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(item.averageCost)}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(item.totalValue)}
                            </TableCell>
                            <TableCell>
                              {item.quantityAvailable <= item.reorderPoint ? (
                                <Badge variant="destructive" className="gap-1">
                                  <AlertTriangle className="h-3 w-3" />
                                  Low Stock
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                  In Stock
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                            No inventory found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Low Stock Tab */}
          <TabsContent value="low-stock" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Low Stock Alerts</CardTitle>
                <CardDescription>
                  Products below reorder point
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SKU</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">On Hand</TableHead>
                      <TableHead className="text-right">Reorder Point</TableHead>
                      <TableHead className="text-right">Shortage</TableHead>
                      <TableHead className="text-right">Reorder Qty</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lowStockData?.items && lowStockData.items.length > 0 ? (
                      lowStockData.items.map((item: any) => (
                        <TableRow key={item.productId}>
                          <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                          <TableCell>{item.productName}</TableCell>
                          <TableCell className="text-right">
                            <span className="text-orange-600 font-medium">
                              {item.quantityOnHand}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">{item.reorderPoint}</TableCell>
                          <TableCell className="text-right">
                            <span className="text-red-600 font-medium">
                              -{item.shortage}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">{item.reorderQuantity}</TableCell>
                          <TableCell>
                            <Button size="sm" variant="outline">
                              Create PO
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          All products are adequately stocked
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>Inventory movements and adjustments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  Transaction history will appear here
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aging Report Tab */}
          <TabsContent value="aging" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Inventory Aging Report</CardTitle>
                <CardDescription>Track slow-moving and dead stock</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  Aging report will appear here
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
