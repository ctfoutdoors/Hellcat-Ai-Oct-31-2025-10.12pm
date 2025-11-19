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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { trpc } from "@/lib/trpc";
import { RefreshCw, Warehouse, ChevronDown, ChevronRight, Package } from "lucide-react";

export default function ShipStationInventory() {
  const { user, loading: authLoading } = useAuth();
  const [expandedWarehouses, setExpandedWarehouses] = useState<Set<number>>(new Set());

  // Fetch ShipStation warehouses and inventory
  const { data: warehouses, isLoading, refetch } = trpc.shipstation.listWarehouses.useQuery();

  const toggleWarehouse = (warehouseId: number) => {
    const newExpanded = new Set(expandedWarehouses);
    if (newExpanded.has(warehouseId)) {
      newExpanded.delete(warehouseId);
    } else {
      newExpanded.add(warehouseId);
    }
    setExpandedWarehouses(newExpanded);
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const warehouseList = warehouses || [];
  const totalSKUs = warehouseList.reduce((sum: number, w: any) => sum + (w.skus?.length || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">ShipStation Master Inventory</h1>
          <p className="text-muted-foreground">
            View all warehouses and SKU inventory from ShipStation
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Warehouses</CardTitle>
            <Warehouse className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{warehouseList.length}</div>
            <p className="text-xs text-muted-foreground">
              Active locations
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total SKUs</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSKUs}</div>
            <p className="text-xs text-muted-foreground">
              Across all warehouses
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Units</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {warehouseList.reduce((sum: number, w: any) => 
                sum + (w.skus?.reduce((s: number, sku: any) => s + (sku.quantity || 0), 0) || 0), 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              In stock
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Warehouses List */}
      <Card>
        <CardHeader>
          <CardTitle>Warehouses</CardTitle>
          <CardDescription>
            {warehouseList.length} warehouse{warehouseList.length !== 1 ? "s" : ""} found in ShipStation
          </CardDescription>
        </CardHeader>
        <CardContent>
          {warehouseList.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Warehouse className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>No warehouses found in ShipStation</p>
            </div>
          ) : (
            <div className="space-y-4">
              {warehouseList.map((warehouse: any) => (
                <Collapsible
                  key={warehouse.warehouseId}
                  open={expandedWarehouses.has(warehouse.warehouseId)}
                  onOpenChange={() => toggleWarehouse(warehouse.warehouseId)}
                >
                  <Card>
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            {expandedWarehouses.has(warehouse.warehouseId) ? (
                              <ChevronDown className="h-5 w-5 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            )}
                            <div>
                              <CardTitle className="text-lg">{warehouse.warehouseName}</CardTitle>
                              <CardDescription>
                                {warehouse.city}, {warehouse.state} {warehouse.postalCode}
                              </CardDescription>
                            </div>
                          </div>
                          <Badge variant="outline">
                            {warehouse.skus?.length || 0} SKUs
                          </Badge>
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent>
                        {warehouse.skus && warehouse.skus.length > 0 ? (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>SKU</TableHead>
                                <TableHead>Product Name</TableHead>
                                <TableHead className="text-right">Quantity</TableHead>
                                <TableHead className="text-right">Available</TableHead>
                                <TableHead className="text-right">On Hold</TableHead>
                                <TableHead>Location</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {warehouse.skus.map((sku: any, idx: number) => (
                                <TableRow key={idx}>
                                  <TableCell className="font-mono text-sm">
                                    {sku.sku}
                                  </TableCell>
                                  <TableCell>{sku.productName || "—"}</TableCell>
                                  <TableCell className="text-right font-medium">
                                    {sku.quantity || 0}
                                  </TableCell>
                                  <TableCell className="text-right text-green-600">
                                    {sku.available || 0}
                                  </TableCell>
                                  <TableCell className="text-right text-yellow-600">
                                    {sku.onHold || 0}
                                  </TableCell>
                                  <TableCell className="text-sm text-muted-foreground">
                                    {sku.binLocation || "—"}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <Package className="mx-auto h-8 w-8 mb-2 opacity-50" />
                            <p className="text-sm">No SKUs in this warehouse</p>
                          </div>
                        )}
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
