import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  History,
  Download,
  Filter,
  User,
  Calendar,
  FileText,
  Package,
  ShoppingCart,
  ArrowRight,
  Search
} from "lucide-react";

interface AuditLog {
  id: number;
  timestamp: Date;
  user: string;
  action: string;
  module: "cases" | "orders" | "inventory" | "system";
  entityType: string;
  entityId: string;
  fieldChanged?: string;
  oldValue?: string;
  newValue?: string;
  description: string;
}

export default function AuditTrail() {
  const [moduleFilter, setModuleFilter] = useState<string>("all");
  const [userFilter, setUserFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Mock audit log data
  const allLogs: AuditLog[] = [
    {
      id: 1,
      timestamp: new Date("2025-11-02T14:30:00"),
      user: "Herve Drompt",
      action: "status_change",
      module: "cases",
      entityType: "Case",
      entityId: "CASE-2025-001",
      fieldChanged: "status",
      oldValue: "investigating",
      newValue: "resolved_won",
      description: "Changed case status from Investigating to Resolved Won"
    },
    {
      id: 2,
      timestamp: new Date("2025-11-02T14:15:00"),
      user: "Herve Drompt",
      action: "create",
      module: "orders",
      entityType: "Purchase Order",
      entityId: "PO-2025-004",
      description: "Created new purchase order for Office Depot - $3,250.00"
    },
    {
      id: 3,
      timestamp: new Date("2025-11-02T13:45:00"),
      user: "System",
      action: "stock_alert",
      module: "inventory",
      entityType: "Inventory Item",
      entityId: "TAPE-2IN-CLR",
      description: "Low stock alert triggered for Packing Tape 2in Clear (85 units remaining)"
    },
    {
      id: 4,
      timestamp: new Date("2025-11-02T13:30:00"),
      user: "Herve Drompt",
      action: "update",
      module: "cases",
      entityType: "Case",
      entityId: "CASE-2025-045",
      fieldChanged: "claimAmount",
      oldValue: "$1,200.00",
      newValue: "$1,450.00",
      description: "Updated claim amount from $1,200.00 to $1,450.00"
    },
    {
      id: 5,
      timestamp: new Date("2025-11-02T12:00:00"),
      user: "Herve Drompt",
      action: "bulk_update",
      module: "cases",
      entityType: "Case",
      entityId: "Multiple",
      description: "Bulk updated status for 5 cases to 'Under Review'"
    },
    {
      id: 6,
      timestamp: new Date("2025-11-02T11:30:00"),
      user: "System",
      action: "auto_reorder",
      module: "inventory",
      entityType: "Purchase Order",
      entityId: "PO-2025-003",
      description: "Auto-generated purchase order for Bubble Wrap based on AI prediction"
    },
    {
      id: 7,
      timestamp: new Date("2025-11-02T10:15:00"),
      user: "Herve Drompt",
      action: "delete",
      module: "cases",
      entityType: "Case",
      entityId: "CASE-2025-012",
      description: "Deleted draft case CASE-2025-012"
    },
    {
      id: 8,
      timestamp: new Date("2025-11-02T09:45:00"),
      user: "Herve Drompt",
      action: "export",
      module: "orders",
      entityType: "Report",
      entityId: "N/A",
      description: "Exported 127 orders to CSV"
    },
    {
      id: 9,
      timestamp: new Date("2025-11-01T16:30:00"),
      user: "System",
      action: "integration_sync",
      module: "system",
      entityType: "Integration",
      entityId: "ShipStation",
      description: "Synced 23 new orders from ShipStation"
    },
    {
      id: 10,
      timestamp: new Date("2025-11-01T15:00:00"),
      user: "Herve Drompt",
      action: "create",
      module: "cases",
      entityType: "Case",
      entityId: "CASE-2025-089",
      description: "Created new damage claim case for UPS shipment"
    },
  ];

  // Apply filters
  let filteredLogs = allLogs;
  
  if (moduleFilter !== "all") {
    filteredLogs = filteredLogs.filter(log => log.module === moduleFilter);
  }
  
  if (userFilter !== "all") {
    filteredLogs = filteredLogs.filter(log => log.user === userFilter);
  }
  
  if (dateFrom) {
    filteredLogs = filteredLogs.filter(log => log.timestamp >= new Date(dateFrom));
  }
  
  if (dateTo) {
    filteredLogs = filteredLogs.filter(log => log.timestamp <= new Date(dateTo));
  }
  
  if (searchTerm) {
    filteredLogs = filteredLogs.filter(log =>
      log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entityId.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  const getModuleIcon = (module: string) => {
    switch (module) {
      case "cases":
        return <FileText className="h-4 w-4" />;
      case "orders":
        return <ShoppingCart className="h-4 w-4" />;
      case "inventory":
        return <Package className="h-4 w-4" />;
      default:
        return <History className="h-4 w-4" />;
    }
  };

  const getModuleColor = (module: string) => {
    switch (module) {
      case "cases":
        return "bg-blue-500/20 text-blue-300 border-blue-500/50";
      case "orders":
        return "bg-green-500/20 text-green-300 border-green-500/50";
      case "inventory":
        return "bg-purple-500/20 text-purple-300 border-purple-500/50";
      default:
        return "bg-gray-500/20 text-gray-300 border-gray-500/50";
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "create":
        return "bg-green-500/20 text-green-300";
      case "update":
      case "bulk_update":
        return "bg-yellow-500/20 text-yellow-300";
      case "delete":
        return "bg-red-500/20 text-red-300";
      case "status_change":
        return "bg-blue-500/20 text-blue-300";
      default:
        return "bg-gray-500/20 text-gray-300";
    }
  };

  const formatTimestamp = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const handleExport = () => {
    console.log("Exporting audit logs...");
    // TODO: Implement actual export
  };

  const uniqueUsers = Array.from(new Set(allLogs.map(log => log.user)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-3">
            <History className="h-8 w-8 text-blue-500" />
            <h1 className="text-3xl font-bold">Audit Trail</h1>
          </div>
          <p className="text-muted-foreground mt-2">
            Complete history of all system changes and actions
          </p>
        </div>
        <Button onClick={handleExport} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export Logs
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            <CardTitle>Filter Audit Logs</CardTitle>
          </div>
          <CardDescription>
            Filter by module, user, date range, or search
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={moduleFilter} onValueChange={setModuleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Modules" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Modules</SelectItem>
                <SelectItem value="cases">Cases</SelectItem>
                <SelectItem value="orders">Orders</SelectItem>
                <SelectItem value="inventory">Inventory</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>

            <Select value={userFilter} onValueChange={setUserFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Users" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                {uniqueUsers.map(user => (
                  <SelectItem key={user} value={user}>{user}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              placeholder="From date"
            />

            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              placeholder="To date"
            />
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Events</CardDescription>
            <CardTitle className="text-3xl">{filteredLogs.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Today's Events</CardDescription>
            <CardTitle className="text-3xl">
              {filteredLogs.filter(log => {
                const today = new Date();
                return log.timestamp.toDateString() === today.toDateString();
              }).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Active Users</CardDescription>
            <CardTitle className="text-3xl">
              {Array.from(new Set(filteredLogs.map(log => log.user))).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Modules Affected</CardDescription>
            <CardTitle className="text-3xl">
              {Array.from(new Set(filteredLogs.map(log => log.module))).length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Timeline</CardTitle>
          <CardDescription>
            Chronological view of all system activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredLogs.map((log, index) => (
              <div key={log.id} className="relative">
                {/* Timeline line */}
                {index < filteredLogs.length - 1 && (
                  <div className="absolute left-[15px] top-[40px] w-[2px] h-[calc(100%+16px)] bg-border" />
                )}

                <div className="flex gap-4">
                  {/* Timeline dot */}
                  <div className="relative flex-shrink-0">
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${getModuleColor(log.module)}`}>
                      {getModuleIcon(log.module)}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-6">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={getActionColor(log.action)}>
                          {log.action.replace(/_/g, " ")}
                        </Badge>
                        <Badge variant="outline" className={getModuleColor(log.module)}>
                          {log.module}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {log.entityType} • {log.entityId}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatTimestamp(log.timestamp)}
                      </span>
                    </div>

                    <p className="text-sm mb-2">{log.description}</p>

                    {log.fieldChanged && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/50 p-2 rounded">
                        <span className="font-medium">{log.fieldChanged}:</span>
                        <span className="line-through">{log.oldValue}</span>
                        <ArrowRight className="h-3 w-3" />
                        <span className="text-foreground font-medium">{log.newValue}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <User className="h-3 w-3" />
                      <span>{log.user}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {filteredLogs.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No audit logs found matching your filters</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
