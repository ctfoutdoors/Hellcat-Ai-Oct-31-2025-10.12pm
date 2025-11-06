import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Filter,
  Download,
  Upload,
  Settings,
  MoreVertical,
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronDown,
  Eye,
  Edit,
  Trash2,
  Copy,
  BarChart3,
  RefreshCw,
  Plus,
  Minus,
} from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import { ColumnCustomizer, type Column } from "@/components/ColumnCustomizer";

// Mock data matching SellerCloud Inventory structure
const mockInventory = [
  {
    id: 1,
    sku: "PKG-BOX-001",
    productName: "Shipping Box 12x12x12",
    brandName: "Uline",
    categoryName: "Packaging",
    condition: "new",
    status: "active",
    quantityOnHand: 250,
    quantityAvailable: 200,
    quantityReserved: 50,
    reorderPoint: 100,
    reorderQuantity: 500,
    cost: 2.50,
    sitePrice: 5.99,
    warehouseName: "Main Warehouse",
    binLocation: "A-12-03",
    inventoryStatus: "in_stock",
    lastSoldDate: new Date("2024-10-30"),
    upc: "123456789012",
  },
  {
    id: 2,
    sku: "PKG-TAPE-002",
    productName: "Packing Tape 2in Clear",
    brandName: "3M",
    categoryName: "Packaging",
    condition: "new",
    status: "active",
    quantityOnHand: 45,
    quantityAvailable: 45,
    quantityReserved: 0,
    reorderPoint: 50,
    reorderQuantity: 200,
    cost: 1.25,
    sitePrice: 3.49,
    warehouseName: "Main Warehouse",
    binLocation: "B-05-12",
    inventoryStatus: "low_stock",
    lastSoldDate: new Date("2024-11-01"),
    upc: "987654321098",
  },
  {
    id: 3,
    sku: "PKG-BUBBLE-003",
    productName: "Bubble Wrap 12x100ft",
    brandName: "Sealed Air",
    categoryName: "Packaging",
    condition: "new",
    status: "active",
    quantityOnHand: 0,
    quantityAvailable: 0,
    quantityReserved: 0,
    reorderPoint: 25,
    reorderQuantity: 100,
    cost: 8.99,
    sitePrice: 19.99,
    warehouseName: "Main Warehouse",
    binLocation: "C-08-05",
    inventoryStatus: "out_of_stock",
    lastSoldDate: new Date("2024-10-28"),
    upc: "456789012345",
  },
];

const defaultColumns: Column[] = [
  { id: "select", label: "", visible: true, sortable: false, width: 50 },
  { id: "sku", label: "SKU", visible: true, sortable: true },
  { id: "productName", label: "Product Name", visible: true, sortable: true },
  { id: "brandName", label: "Brand", visible: true, sortable: true },
  { id: "categoryName", label: "Category", visible: true, sortable: true },
  { id: "condition", label: "Condition", visible: false, sortable: true },
  { id: "status", label: "Status", visible: true, sortable: true },
  { id: "quantityOnHand", label: "On Hand", visible: true, sortable: true },
  { id: "quantityAvailable", label: "Available", visible: true, sortable: true },
  { id: "quantityReserved", label: "Reserved", visible: false, sortable: true },
  { id: "reorderPoint", label: "Reorder Point", visible: false, sortable: true },
  { id: "cost", label: "Cost", visible: true, sortable: true },
  { id: "sitePrice", label: "Price", visible: true, sortable: true },
  { id: "warehouseName", label: "Warehouse", visible: true, sortable: true },
  { id: "binLocation", label: "Bin", visible: false, sortable: true },
  { id: "inventoryStatus", label: "Inventory Status", visible: true, sortable: true },
  { id: "lastSoldDate", label: "Last Sold", visible: false, sortable: true },
  { id: "upc", label: "UPC", visible: false, sortable: true },
  { id: "actions", label: "Actions", visible: true, sortable: false, width: 100 },
];

export default function InventoryManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [showColumnCustomizer, setShowColumnCustomizer] = useState(false);
  const [columns, setColumns] = useState<Column[]>(defaultColumns);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const [filters, setFilters] = useState({
    status: "all",
    inventoryStatus: "all",
    brandName: "all",
    categoryName: "all",
    warehouseName: "all",
    quantityMin: "",
    quantityMax: "",
    costMin: "",
    costMax: "",
  });

  const handleSelectAll = () => {
    if (selectedItems.length === mockInventory.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(mockInventory.map((i) => i.id));
    }
  };

  const handleSelectItem = (itemId: number) => {
    setSelectedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleBulkAction = (action: string) => {
    toast.success(`${action} applied to ${selectedItems.length} items`);
    setSelectedItems([]);
  };

  const getInventoryStatusBadge = (status: string) => {
    const config = {
      in_stock: { variant: "default" as const, icon: CheckCircle2, color: "text-green-500" },
      low_stock: { variant: "secondary" as const, icon: AlertTriangle, color: "text-yellow-500" },
      out_of_stock: { variant: "destructive" as const, icon: XCircle, color: "text-red-500" },
    };

    const { variant, icon: Icon, color } = config[status as keyof typeof config] || config.in_stock;

    return (
      <Badge variant={variant} className="gap-1">
        <Icon className={`h-3 w-3 ${color}`} />
        {status.replace("_", " ")}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "default",
      inactive: "secondary",
      discontinued: "destructive",
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
        {status}
      </Badge>
    );
  };

  const visibleColumns = columns.filter((col) => col.visible);

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Package className="h-8 w-8" />
            Inventory Management
          </h1>
          <p className="text-muted-foreground mt-1">
            {mockInventory.length} products • {selectedItems.length} selected
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline">
            <BarChart3 className="h-4 w-4 mr-2" />
            Reports
          </Button>
          <Button>
            <Package className="h-4 w-4 mr-2" />
            New Product
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Products</p>
              <p className="text-2xl font-bold">{mockInventory.length}</p>
            </div>
            <Package className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Value</p>
              <p className="text-2xl font-bold">
                ${mockInventory.reduce((sum, item) => sum + (item.quantityOnHand * item.cost), 0).toFixed(2)}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Low Stock Items</p>
              <p className="text-2xl font-bold text-yellow-500">
                {mockInventory.filter(i => i.inventoryStatus === "low_stock").length}
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Out of Stock</p>
              <p className="text-2xl font-bold text-red-500">
                {mockInventory.filter(i => i.inventoryStatus === "out_of_stock").length}
              </p>
            </div>
            <XCircle className="h-8 w-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Bulk Actions Toolbar */}
      {selectedItems.length > 0 && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-4 flex items-center justify-between">
          <span className="font-medium">
            {selectedItems.length} item{selectedItems.length > 1 ? "s" : ""} selected
          </span>
          <div className="flex gap-2">
            <Select onValueChange={handleBulkAction}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Bulk Actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Adjust Quantity">Adjust Quantity</SelectItem>
                <SelectItem value="Update Pricing">Update Pricing</SelectItem>
                <SelectItem value="Change Status">Change Status</SelectItem>
                <SelectItem value="Move to Warehouse">Move to Warehouse</SelectItem>
                <SelectItem value="Generate Labels">Generate Labels</SelectItem>
                <SelectItem value="Export Selected">Export Selected</SelectItem>
                <SelectItem value="Delete">Delete</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => setSelectedItems([])}>
              Clear Selection
            </Button>
          </div>
        </div>
      )}

      {/* Filters & Search */}
      <div className="bg-card border rounded-lg p-4 mb-4 space-y-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by SKU, product name, UPC, barcode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filters.inventoryStatus} onValueChange={(value) => setFilters({ ...filters, inventoryStatus: value })}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Inventory Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="in_stock">In Stock</SelectItem>
              <SelectItem value="low_stock">Low Stock</SelectItem>
              <SelectItem value="out_of_stock">Out of Stock</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.brandName} onValueChange={(value) => setFilters({ ...filters, brandName: value })}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Brand" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Brands</SelectItem>
              <SelectItem value="Uline">Uline</SelectItem>
              <SelectItem value="3M">3M</SelectItem>
              <SelectItem value="Sealed Air">Sealed Air</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Advanced
            <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${showAdvancedFilters ? "rotate-180" : ""}`} />
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowColumnCustomizer(true)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Columns
          </Button>
        </div>

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <div className="grid grid-cols-4 gap-4 pt-4 border-t">
            <div className="space-y-2">
              <label className="text-sm font-medium">Product Status</label>
              <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="discontinued">Discontinued</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select value={filters.categoryName} onValueChange={(value) => setFilters({ ...filters, categoryName: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="Packaging">Packaging</SelectItem>
                  <SelectItem value="Shipping">Shipping</SelectItem>
                  <SelectItem value="Office">Office</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Warehouse</label>
              <Select value={filters.warehouseName} onValueChange={(value) => setFilters({ ...filters, warehouseName: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="Main Warehouse">Main Warehouse</SelectItem>
                  <SelectItem value="East Coast">East Coast</SelectItem>
                  <SelectItem value="West Coast">West Coast</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Quantity Min</label>
              <Input
                type="number"
                placeholder="0"
                value={filters.quantityMin}
                onChange={(e) => setFilters({ ...filters, quantityMin: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Quantity Max</label>
              <Input
                type="number"
                placeholder="0"
                value={filters.quantityMax}
                onChange={(e) => setFilters({ ...filters, quantityMax: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Cost Min</label>
              <Input
                type="number"
                placeholder="0.00"
                value={filters.costMin}
                onChange={(e) => setFilters({ ...filters, costMin: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Cost Max</label>
              <Input
                type="number"
                placeholder="0.00"
                value={filters.costMax}
                onChange={(e) => setFilters({ ...filters, costMax: e.target.value })}
              />
            </div>
            <div className="flex items-end gap-2">
              <Button variant="outline" className="flex-1">
                <RefreshCw className="h-4 w-4 mr-2" />
                Clear
              </Button>
              <Button className="flex-1">Apply</Button>
            </div>
          </div>
        )}
      </div>

      {/* Inventory Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                {visibleColumns.map((column) => (
                  <th
                    key={column.id}
                    className="px-4 py-3 text-left text-sm font-medium"
                    style={{ width: column.width }}
                  >
                    {column.id === "select" ? (
                      <Checkbox
                        checked={selectedItems.length === mockInventory.length}
                        onCheckedChange={handleSelectAll}
                      />
                    ) : (
                      column.label
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {mockInventory.map((item) => (
                <tr key={item.id} className="hover:bg-muted/50">
                  {visibleColumns.map((column) => (
                    <td key={column.id} className="px-4 py-3 text-sm">
                      {column.id === "select" && (
                        <Checkbox
                          checked={selectedItems.includes(item.id)}
                          onCheckedChange={() => handleSelectItem(item.id)}
                        />
                      )}
                      {column.id === "sku" && (
                        <Link href={`/inventory/${item.id}`}>
                          <a className="text-primary hover:underline font-medium font-mono">
                            {item.sku}
                          </a>
                        </Link>
                      )}
                      {column.id === "productName" && (
                        <div className="font-medium">{item.productName}</div>
                      )}
                      {column.id === "brandName" && item.brandName}
                      {column.id === "categoryName" && (
                        <Badge variant="outline">{item.categoryName}</Badge>
                      )}
                      {column.id === "condition" && item.condition}
                      {column.id === "status" && getStatusBadge(item.status)}
                      {column.id === "quantityOnHand" && (
                        <span className="font-medium">{item.quantityOnHand}</span>
                      )}
                      {column.id === "quantityAvailable" && (
                        <span className="text-muted-foreground">{item.quantityAvailable}</span>
                      )}
                      {column.id === "quantityReserved" && (
                        <span className="text-muted-foreground">{item.quantityReserved}</span>
                      )}
                      {column.id === "reorderPoint" && item.reorderPoint}
                      {column.id === "cost" && (
                        <span className="font-medium">${item.cost.toFixed(2)}</span>
                      )}
                      {column.id === "sitePrice" && (
                        <span className="font-medium">${item.sitePrice.toFixed(2)}</span>
                      )}
                      {column.id === "warehouseName" && item.warehouseName}
                      {column.id === "binLocation" && (
                        <span className="font-mono text-xs">{item.binLocation}</span>
                      )}
                      {column.id === "inventoryStatus" && getInventoryStatusBadge(item.inventoryStatus)}
                      {column.id === "lastSoldDate" && (
                        <span className="text-muted-foreground">
                          {item.lastSoldDate.toLocaleDateString()}
                        </span>
                      )}
                      {column.id === "upc" && (
                        <span className="font-mono text-xs">{item.upc}</span>
                      )}
                      {column.id === "actions" && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Product
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Plus className="h-4 w-4 mr-2" />
                              Add Stock
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Minus className="h-4 w-4 mr-2" />
                              Remove Stock
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <BarChart3 className="h-4 w-4 mr-2" />
                              View History
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <p className="text-sm text-muted-foreground">
          Showing 1-{mockInventory.length} of {mockInventory.length} products
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled>
            Previous
          </Button>
          <Button variant="outline" size="sm">
            Next
          </Button>
        </div>
      </div>

      {/* Column Customizer Dialog */}
      <ColumnCustomizer
        open={showColumnCustomizer}
        onOpenChange={setShowColumnCustomizer}
        columns={columns}
        onColumnsChange={setColumns}
        onReset={() => setColumns(defaultColumns)}
      />
    </div>
  );
}
