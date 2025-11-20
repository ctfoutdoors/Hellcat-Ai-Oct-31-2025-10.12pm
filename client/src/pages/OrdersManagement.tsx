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
  Truck,
  DollarSign,
  Calendar,
  User,
  MapPin,
  ChevronDown,
  Eye,
  Edit,
  Trash2,
  Copy,
  Mail,
  Printer,
  RefreshCw,
} from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";
import { ColumnCustomizer, type Column } from "@/components/ColumnCustomizer";

// ShipStation Balance Display Component
function ShipStationBalance() {
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [isSyncing, setIsSyncing] = useState(false);
  
  const { data: balance, isLoading, refetch } = trpc.shipstation.getAccountBalance.useQuery(undefined, {
    refetchInterval: 3600000, // Refresh every hour (60 * 60 * 1000)
    onSuccess: () => {
      setLastSyncTime(new Date());
    },
  });

  const handleManualSync = async () => {
    setIsSyncing(true);
    await refetch();
    setIsSyncing(false);
    toast.success('Balance synced successfully');
  };

  const getTimeSinceSync = () => {
    const now = new Date();
    const diffMs = now.getTime() - lastSyncTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins === 1) return '1 minute ago';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return '1 hour ago';
    return `${diffHours} hours ago`;
  };

  if (isLoading && !balance) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-md">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm text-muted-foreground">Loading balance...</span>
      </div>
    );
  }

  const balanceValue = balance?.balance || 0;
  const isNegative = balanceValue < 0;
  const absBalance = Math.abs(balanceValue);

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-muted rounded-md">
      <DollarSign className={`h-4 w-4 ${isNegative ? 'text-red-600' : 'text-green-600'}`} />
      <div className="flex flex-col">
        <span className={`text-sm font-medium ${isNegative ? 'text-red-600' : ''}`}>
          {isNegative ? '-' : ''}${absBalance.toFixed(2)}
        </span>
        <span className="text-xs text-muted-foreground">
          {balance?.carrierName || 'ShipStation'} Balance {isNegative ? '(Owed)' : ''}
        </span>
      </div>
      <div className="flex flex-col items-end border-l pl-3 ml-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleManualSync}
          disabled={isSyncing}
          className="h-6 px-2"
        >
          <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
        </Button>
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {getTimeSinceSync()}
        </span>
      </div>
    </div>
  );
}

// Import Today's Orders Button Component
function ImportTodaysOrdersButton() {
  const utils = trpc.useUtils();
  const importMutation = trpc.woocommerce.importTodaysOrders.useMutation({
    onSuccess: (data) => {
      toast.success(`Imported ${data.imported} orders, skipped ${data.skipped} duplicates`);
      // Refresh the orders list
      utils.orders.getOrders.invalidate();
    },
    onError: (error) => {
      toast.error(`Import failed: ${error.message}`);
    },
  });

  return (
    <Button
      variant="default"
      onClick={() => importMutation.mutate()}
      disabled={importMutation.isPending}
    >
      {importMutation.isPending ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Importing from WooCommerce...
        </>
      ) : (
        <>
          <Download className="h-4 w-4 mr-2" />
          Import Today's Orders
        </>
      )}
    </Button>
  );
}

const defaultColumns: Column[] = [
  { id: "select", label: "", visible: true, sortable: false, width: 50 },
  { id: "orderNumber", label: "Order #", visible: true, sortable: true },
  { id: "channelOrderNumber", label: "Channel Order #", visible: true, sortable: true },
  { id: "orderDate", label: "Order Date", visible: true, sortable: true },
  { id: "customerName", label: "Customer", visible: true, sortable: true },
  { id: "companyName", label: "Company", visible: true, sortable: true },
  { id: "channelName", label: "Channel", visible: true, sortable: true },
  { id: "orderStatus", label: "Status", visible: true, sortable: true },
  { id: "paymentStatus", label: "Payment", visible: true, sortable: true },
  { id: "shippingStatus", label: "Shipping", visible: true, sortable: true },
  { id: "totalAmount", label: "Total", visible: true, sortable: true },
  { id: "itemCount", label: "Items", visible: true, sortable: true },
  { id: "shippingMethod", label: "Ship Method", visible: false, sortable: true },
  { id: "warehouseName", label: "Warehouse", visible: false, sortable: true },
  { id: "trackingNumber", label: "Tracking #", visible: false, sortable: true },
  { id: "actions", label: "Actions", visible: true, sortable: false, width: 100 },
];

export default function OrdersManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
  const [showColumnCustomizer, setShowColumnCustomizer] = useState(false);
  const [columns, setColumns] = useState<Column[]>(defaultColumns);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const [filters, setFilters] = useState({
    orderStatus: "all",
    paymentStatus: "all",
    shippingStatus: "all",
    channelName: "all",
    dateFrom: "",
    dateTo: "",
    amountMin: "",
    amountMax: "",
  });

  // Fetch real orders from database
  const { data: ordersData, isLoading } = trpc.orders.getOrders.useQuery({
    page: 1,
    limit: 50,
    ...(searchTerm.trim() && { searchTerm: searchTerm.trim() }),
    ...(filters.orderStatus !== "all" && { status: filters.orderStatus }),
    ...(filters.channelName !== "all" && { channel: filters.channelName }),
  });
  const orders = ordersData?.orders || [];

  // ShipStation sync mutations
  const syncMutation = trpc.shipstation.syncOrders.useMutation({
    onSuccess: (result) => {
      toast.success("ShipStation Sync Complete", {
        description: `Created: ${result.ordersCreated}, Updated: ${result.ordersUpdated}, Processed: ${result.ordersProcessed}`,
      });
      // Refresh page to show new orders
      window.location.reload();
    },
    onError: (error) => {
      toast.error(`Sync failed: ${error.message}`);
    },
  });

  const shipmentSyncMutation = trpc.shipstation.syncShipments.useMutation({
    onSuccess: (result) => {
      toast.success("Shipment Matching Complete", {
        description: `Matched: ${result.ordersMatched}, Unmatched: ${result.ordersUnmatched}`,
      });
      // Refresh page to show updated tracking info
      window.location.reload();
    },
    onError: (error) => {
      toast.error(`Shipment sync failed: ${error.message}`);
    },
  });

  // Tracking refresh mutation
  const refreshTrackingMutation = trpc.orders.refreshTracking.useMutation({
    onSuccess: (result) => {
      if (result.success && result.trackingNumber) {
        toast.success("Tracking Updated", {
          description: `Tracking: ${result.trackingNumber} via ${result.carrierCode}`,
        });
        window.location.reload();
      } else {
        toast.warning("No Tracking Found", {
          description: result.error || "ShipStation has no tracking info for this order yet",
        });
      }
    },
    onError: (error) => {
      toast.error(`Refresh failed: ${error.message}`);
    },
  });

  // Auto-refresh missing tracking mutation
  const autoRefreshMutation = trpc.orders.autoRefreshMissingTracking.useMutation({
    onSuccess: (result) => {
      toast.success("Bulk Refresh Complete", {
        description: `Updated: ${result.updated}, Failed: ${result.failed}, Total: ${result.processed}`,
      });
      window.location.reload();
    },
    onError: (error) => {
      toast.error(`Auto-refresh failed: ${error.message}`);
    },
  });

  const handleRefreshTracking = (orderId: number) => {
    refreshTrackingMutation.mutate({ orderId });
  };

  const handleAutoRefreshAll = () => {
    if (confirm('This will attempt to refresh tracking for up to 50 orders with missing tracking. Continue?')) {
      autoRefreshMutation.mutate({ limit: 50 });
    }
  };

  const handleSelectAll = () => {
    if (selectedOrders.length === orders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(orders.map((o) => o.id));
    }
  };

  const handleSelectOrder = (orderId: number) => {
    setSelectedOrders((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleBulkAction = (action: string) => {
    toast.success(`${action} applied to ${selectedOrders.length} orders`);
    setSelectedOrders([]);
  };

  const getStatusBadge = (status: string, type: "order" | "payment" | "shipping") => {
    const variants: Record<string, any> = {
      order: {
        pending: "secondary",
        processing: "default",
        shipped: "default",
        delivered: "default",
        cancelled: "destructive",
      },
      payment: {
        unpaid: "destructive",
        paid: "default",
        refunded: "secondary",
      },
      shipping: {
        not_shipped: "secondary",
        in_transit: "default",
        delivered: "default",
      },
    };

    if (!status) {
      return <Badge variant="secondary">—</Badge>;
    }
    
    return (
      <Badge variant={variants[type][status] || "secondary"}>
        {status.replace("_", " ")}
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
            Orders Management
          </h1>
          <p className="text-muted-foreground mt-1">
            {isLoading ? '...' : orders.length} orders • {selectedOrders.length} selected
          </p>
        </div>
        <div className="flex gap-2">
          <ShipStationBalance />
          <ImportTodaysOrdersButton />
          <Button
            variant="outline"
            onClick={() => syncMutation.mutate({ daysBack: 30 })}
            disabled={syncMutation.isPending || shipmentSyncMutation.isPending}
          >
            {syncMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Sync Orders
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => shipmentSyncMutation.mutate({ daysBack: 30 })}
            disabled={syncMutation.isPending || shipmentSyncMutation.isPending}
          >
            {shipmentSyncMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Matching...
              </>
            ) : (
              <>
                <Truck className="h-4 w-4 mr-2" />
                Match Shipments
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={handleAutoRefreshAll}
            disabled={autoRefreshMutation.isPending}
          >
            {autoRefreshMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Auto-Refresh Tracking
              </>
            )}
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button>
            <Package className="h-4 w-4 mr-2" />
            New Order
          </Button>
        </div>
      </div>

      {/* Bulk Actions Toolbar */}
      {selectedOrders.length > 0 && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-4 flex items-center justify-between">
          <span className="font-medium">
            {selectedOrders.length} order{selectedOrders.length > 1 ? "s" : ""} selected
          </span>
          <div className="flex gap-2">
            <Select onValueChange={handleBulkAction}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Bulk Actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Update Status">Update Status</SelectItem>
                <SelectItem value="Mark as Shipped">Mark as Shipped</SelectItem>
                <SelectItem value="Print Labels">Print Labels</SelectItem>
                <SelectItem value="Send Email">Send Email</SelectItem>
                <SelectItem value="Export Selected">Export Selected</SelectItem>
                <SelectItem value="Delete">Delete</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => setSelectedOrders([])}>
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
              placeholder="Search by order #, customer, email, tracking..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filters.orderStatus} onValueChange={(value) => setFilters({ ...filters, orderStatus: value })}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Order Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.channelName} onValueChange={(value) => setFilters({ ...filters, channelName: value })}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Channel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Channels</SelectItem>
              <SelectItem value="Amazon">Amazon</SelectItem>
              <SelectItem value="Shopify">Shopify</SelectItem>
              <SelectItem value="eBay">eBay</SelectItem>
              <SelectItem value="Walmart">Walmart</SelectItem>
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
              <label className="text-sm font-medium">Payment Status</label>
              <Select value={filters.paymentStatus} onValueChange={(value) => setFilters({ ...filters, paymentStatus: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Shipping Status</label>
              <Select value={filters.shippingStatus} onValueChange={(value) => setFilters({ ...filters, shippingStatus: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="not_shipped">Not Shipped</SelectItem>
                  <SelectItem value="in_transit">In Transit</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Date From</label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Date To</label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Amount Min</label>
              <Input
                type="number"
                placeholder="0.00"
                value={filters.amountMin}
                onChange={(e) => setFilters({ ...filters, amountMin: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Amount Max</label>
              <Input
                type="number"
                placeholder="0.00"
                value={filters.amountMax}
                onChange={(e) => setFilters({ ...filters, amountMax: e.target.value })}
              />
            </div>
            <div className="col-span-2 flex items-end gap-2">
              <Button variant="outline" className="flex-1">
                <RefreshCw className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
              <Button className="flex-1">Apply Filters</Button>
            </div>
          </div>
        )}
      </div>

      {/* Orders Table */}
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
                        checked={selectedOrders.length === orders.length && orders.length > 0}
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
              {isLoading ? (
                <tr>
                  <td colSpan={visibleColumns.length} className="px-4 py-8 text-center text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    Loading orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumns.length} className="px-4 py-8 text-center text-muted-foreground">
                    No orders found
                  </td>
                </tr>
              ) : orders.map((order) => (
                <tr key={order.id} className="hover:bg-muted/50">
                  {visibleColumns.map((column) => (
                    <td key={column.id} className="px-4 py-3 text-sm">
                      {column.id === "select" && (
                        <Checkbox
                          checked={selectedOrders.includes(order.id)}
                          onCheckedChange={() => handleSelectOrder(order.id)}
                        />
                      )}
                      {column.id === "orderNumber" && (
                        <Link href={`/order/${order.id}`} className="text-primary hover:underline font-medium">
                          {order.orderNumber}
                        </Link>
                      )}
                      {column.id === "channelOrderNumber" && (
                        <span className="text-muted-foreground">{order.channelOrderNumber}</span>
                      )}
                      {column.id === "orderDate" && (
                        <span>{order.orderDate.toLocaleDateString()}</span>
                      )}
                      {column.id === "customerName" && (
                        <div>
                          <Link href={`/crm/customers?search=${encodeURIComponent(order.customerEmail)}`}>
                            <div className="font-medium hover:underline cursor-pointer text-primary">{order.customerName}</div>
                          </Link>
                          <div className="text-xs text-muted-foreground">{order.customerEmail}</div>
                        </div>
                      )}
                      {column.id === "companyName" && order.companyName}
                      {column.id === "channelName" && (
                        <Badge variant="outline">{order.channelName}</Badge>
                      )}
                      {column.id === "orderStatus" && getStatusBadge(order.orderStatus, "order")}
                      {column.id === "paymentStatus" && getStatusBadge(order.paymentStatus, "payment")}
                      {column.id === "shippingStatus" && getStatusBadge(order.shippingStatus, "shipping")}
                      {column.id === "totalAmount" && (
                        <span className="font-medium">
                          ${order.totalAmount ? Number(order.totalAmount).toFixed(2) : '0.00'}
                        </span>
                      )}
                      {column.id === "itemCount" && (
                        <span className="text-muted-foreground">{order.itemCount}</span>
                      )}
                      {column.id === "shippingMethod" && order.shippingMethod}
                      {column.id === "warehouseName" && order.warehouseName}
                      {column.id === "trackingNumber" && (
                        order.trackingNumber ? (
                          <span className="font-mono">{order.trackingNumber}</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )
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
                              Edit Order
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Truck className="h-4 w-4 mr-2" />
                              Ship Order
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Printer className="h-4 w-4 mr-2" />
                              Print Label
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Mail className="h-4 w-4 mr-2" />
                              Email Customer
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleRefreshTracking(order.id)}>
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Refresh Tracking
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Cancel Order
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
          Showing 1-{orders.length} of {ordersData?.total || 0} orders
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
