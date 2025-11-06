import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import {
  Search,
  Filter,
  Download,
  Upload,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Package,
  Warehouse,
  Edit,
  History,
  Plus,
  Minus,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

// Mock stock data - in production this would come from tRPC
const mockStockData = [
  {
    id: 1,
    sku: "PROD-001",
    productName: "Premium Widget",
    warehouse: "Main Warehouse",
    onHand: 150,
    available: 120,
    reserved: 30,
    onOrder: 200,
    reorderPoint: 50,
    reorderQuantity: 100,
    lastUpdated: new Date("2024-11-03T10:00:00"),
    isLowStock: false,
  },
  {
    id: 2,
    sku: "PROD-002",
    productName: "Standard Gadget",
    warehouse: "Main Warehouse",
    onHand: 25,
    available: 15,
    reserved: 10,
    onOrder: 100,
    reorderPoint: 30,
    reorderQuantity: 50,
    lastUpdated: new Date("2024-11-03T09:30:00"),
    isLowStock: true,
  },
  {
    id: 3,
    sku: "PROD-003",
    productName: "Enterprise Solution",
    warehouse: "East Coast",
    onHand: 75,
    available: 60,
    reserved: 15,
    onOrder: 0,
    reorderPoint: 20,
    reorderQuantity: 50,
    lastUpdated: new Date("2024-11-03T11:15:00"),
    isLowStock: false,
  },
  {
    id: 4,
    sku: "PROD-004",
    productName: "Basic Tool",
    warehouse: "West Coast",
    onHand: 5,
    available: 5,
    reserved: 0,
    onOrder: 50,
    reorderPoint: 15,
    reorderQuantity: 30,
    lastUpdated: new Date("2024-11-02T16:00:00"),
    isLowStock: true,
  },
  {
    id: 5,
    sku: "PROD-005",
    productName: "Deluxe Package",
    warehouse: "Main Warehouse",
    onHand: 200,
    available: 180,
    reserved: 20,
    onOrder: 0,
    reorderPoint: 40,
    reorderQuantity: 80,
    lastUpdated: new Date("2024-11-03T08:00:00"),
    isLowStock: false,
  },
];

const warehouses = ["All Warehouses", "Main Warehouse", "East Coast", "West Coast"];
const stockStatuses = ["All", "In Stock", "Low Stock", "Out of Stock"];

export default function StockLevels() {
  const { user, loading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("All Warehouses");
  const [stockStatusFilter, setStockStatusFilter] = useState("All");
  const [showAdjustDialog, setShowAdjustDialog] = useState(false);
  const [selectedStock, setSelectedStock] = useState<typeof mockStockData[0] | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<"add" | "subtract">("add");
  const [adjustmentQuantity, setAdjustmentQuantity] = useState("");
  const [adjustmentReason, setAdjustmentReason] = useState("");

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Filter stock data
  const filteredStock = mockStockData.filter((item) => {
    const matchesSearch =
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.productName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesWarehouse =
      warehouseFilter === "All Warehouses" || item.warehouse === warehouseFilter;
    const matchesStatus =
      stockStatusFilter === "All" ||
      (stockStatusFilter === "Low Stock" && item.isLowStock) ||
      (stockStatusFilter === "Out of Stock" && item.onHand === 0) ||
      (stockStatusFilter === "In Stock" && item.onHand > 0 && !item.isLowStock);
    return matchesSearch && matchesWarehouse && matchesStatus;
  });

  const handleAdjustStock = (stock: typeof mockStockData[0]) => {
    setSelectedStock(stock);
    setShowAdjustDialog(true);
    setAdjustmentQuantity("");
    setAdjustmentReason("");
  };

  const handleSaveAdjustment = () => {
    if (!adjustmentQuantity || !adjustmentReason) {
      toast.error("Please fill in all fields");
      return;
    }

    const qty = parseInt(adjustmentQuantity);
    if (isNaN(qty) || qty <= 0) {
      toast.error("Please enter a valid quantity");
      return;
    }

    // In production, this would call a tRPC mutation
    toast.success(
      `Stock ${adjustmentType === "add" ? "increased" : "decreased"} by ${qty} for ${selectedStock?.sku}`
    );
    setShowAdjustDialog(false);
  };

  const getStockStatusBadge = (item: typeof mockStockData[0]) => {
    if (item.onHand === 0) {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertTriangle className="h-3 w-3" />
          Out of Stock
        </Badge>
      );
    }
    if (item.isLowStock) {
      return (
        <Badge variant="secondary" className="gap-1 bg-yellow-500/20 text-yellow-700 dark:text-yellow-400">
          <AlertTriangle className="h-3 w-3" />
          Low Stock
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="gap-1 bg-green-500/20 text-green-700 dark:text-green-400">
          In Stock
        </Badge>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Stock Levels</h1>
          <p className="text-muted-foreground">
            Current inventory counts across all warehouses
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Package className="h-4 w-4 text-blue-500" />
              Total SKUs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStockData.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              Total On Hand
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockStockData.reduce((sum, item) => sum + item.onHand, 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              Low Stock Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockStockData.filter((item) => item.isLowStock).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-500" />
              Out of Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockStockData.filter((item) => item.onHand === 0).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search SKU or product name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Warehouse</Label>
              <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((warehouse) => (
                    <SelectItem key={warehouse} value={warehouse}>
                      {warehouse}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Stock Status</Label>
              <Select value={stockStatusFilter} onValueChange={setStockStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {stockStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stock Table */}
      <Card>
        <CardHeader>
          <CardTitle>Stock Levels ({filteredStock.length} items)</CardTitle>
          <CardDescription>
            Real-time inventory counts per SKU and warehouse
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead className="text-right">On Hand</TableHead>
                  <TableHead className="text-right">Available</TableHead>
                  <TableHead className="text-right">Reserved</TableHead>
                  <TableHead className="text-right">On Order</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStock.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      No stock items found matching your filters
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStock.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono font-medium">{item.sku}</TableCell>
                      <TableCell>{item.productName}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Warehouse className="h-3 w-3 text-muted-foreground" />
                          {item.warehouse}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">{item.onHand}</TableCell>
                      <TableCell className="text-right">{item.available}</TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {item.reserved}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {item.onOrder}
                      </TableCell>
                      <TableCell>{getStockStatusBadge(item)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {item.lastUpdated.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAdjustStock(item)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <History className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Stock Adjustment Dialog */}
      <Dialog open={showAdjustDialog} onOpenChange={setShowAdjustDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Stock Level</DialogTitle>
            <DialogDescription>
              {selectedStock && (
                <>
                  {selectedStock.sku} - {selectedStock.productName}
                  <br />
                  Current on hand: <strong>{selectedStock.onHand}</strong>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Adjustment Type</Label>
              <div className="flex gap-2">
                <Button
                  variant={adjustmentType === "add" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setAdjustmentType("add")}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Stock
                </Button>
                <Button
                  variant={adjustmentType === "subtract" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setAdjustmentType("subtract")}
                >
                  <Minus className="h-4 w-4 mr-2" />
                  Remove Stock
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                placeholder="Enter quantity"
                value={adjustmentQuantity}
                onChange={(e) => setAdjustmentQuantity(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Select value={adjustmentReason} onValueChange={setAdjustmentReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="receiving">Receiving</SelectItem>
                  <SelectItem value="damage">Damage</SelectItem>
                  <SelectItem value="theft">Theft/Loss</SelectItem>
                  <SelectItem value="return">Customer Return</SelectItem>
                  <SelectItem value="correction">Inventory Correction</SelectItem>
                  <SelectItem value="transfer">Warehouse Transfer</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdjustDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveAdjustment}>Save Adjustment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
