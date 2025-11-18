import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, User, AlertCircle, CheckCircle2, Clock, Search } from "lucide-react";
import { ActionItemDialog } from "@/components/ActionItemDialog";
import { useLocation } from "wouter";

export default function ActionItemsDashboard() {
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [editingActionItem, setEditingActionItem] = useState<any>(null);
  const [selectedVendorId, setSelectedVendorId] = useState<number | null>(null);

  // Fetch all vendors to get their action items
  const { data: vendors } = trpc.crm.vendors.list.useQuery({});
  
  // Collect all action items from all vendors
  const allActionItems = vendors?.flatMap(vendor => 
    vendor.actionItems?.map((item: any) => ({
      ...item,
      vendorId: vendor.id,
      vendorName: vendor.companyName
    })) || []
  ) || [];

  // Apply filters
  const filteredItems = allActionItems.filter(item => {
    if (statusFilter !== "all" && item.status !== statusFilter) return false;
    if (priorityFilter !== "all" && item.priority !== priorityFilter) return false;
    if (assigneeFilter !== "all" && item.assignedTo !== assigneeFilter) return false;
    if (searchTerm && !item.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  // Group by assignee
  const groupedByAssignee = filteredItems.reduce((acc: any, item) => {
    const assignee = item.assignedTo || "Unassigned";
    if (!acc[assignee]) acc[assignee] = [];
    acc[assignee].push(item);
    return acc;
  }, {});

  const getPriorityColor = (priority: string) => {
    if (priority === 'high') return 'destructive';
    if (priority === 'medium') return 'default';
    return 'secondary';
  };

  const getStatusIcon = (status: string) => {
    if (status === 'done') return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    if (status === 'in_progress') return <Clock className="h-4 w-4 text-blue-600" />;
    return <AlertCircle className="h-4 w-4 text-yellow-600" />;
  };

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const uniqueAssignees = Array.from(new Set(allActionItems.map(item => item.assignedTo).filter(Boolean)));

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Action Items Dashboard</h1>
          <p className="text-muted-foreground">Manage all vendor action items across the organization</p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search action items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>

              <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Assignee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assignees</SelectItem>
                  {uniqueAssignees.map(assignee => (
                    <SelectItem key={assignee} value={assignee || ""}>{assignee}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Items</CardDescription>
              <CardTitle className="text-3xl">{filteredItems.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>To Do</CardDescription>
              <CardTitle className="text-3xl text-yellow-600">
                {filteredItems.filter(i => i.status === 'todo').length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>In Progress</CardDescription>
              <CardTitle className="text-3xl text-blue-600">
                {filteredItems.filter(i => i.status === 'in_progress').length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Overdue</CardDescription>
              <CardTitle className="text-3xl text-red-600">
                {filteredItems.filter(i => isOverdue(i.dueDate)).length}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Action Items Grouped by Assignee */}
        <div className="space-y-6">
          {Object.entries(groupedByAssignee).map(([assignee, items]: [string, any]) => (
            <Card key={assignee}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    <CardTitle>{assignee}</CardTitle>
                    <Badge variant="outline">{items.length} items</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {items.map((item: any) => (
                  <div key={item.id} className="rounded-lg border p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 flex-1">
                        {getStatusIcon(item.status)}
                        <div className="flex-1">
                          <p className="font-semibold">{item.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.vendorName}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant={getPriorityColor(item.priority) as any}>
                          {item.priority}
                        </Badge>
                        {isOverdue(item.dueDate) && (
                          <Badge variant="destructive">Overdue</Badge>
                        )}
                      </div>
                    </div>
                    
                    {item.description && (
                      <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {item.dueDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(item.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/crm/vendors/${item.vendorId}`)}
                        >
                          View Vendor
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingActionItem(item);
                            setSelectedVendorId(item.vendorId);
                            setActionDialogOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No action items found matching your filters</p>
            </CardContent>
          </Card>
        )}
      </div>

      {selectedVendorId && (
        <ActionItemDialog
          open={actionDialogOpen}
          onOpenChange={setActionDialogOpen}
          vendorId={selectedVendorId}
          actionItem={editingActionItem}
          onSuccess={() => {
            // Refresh will happen automatically via tRPC
          }}
        />
      )}
    </div>
  );
}
