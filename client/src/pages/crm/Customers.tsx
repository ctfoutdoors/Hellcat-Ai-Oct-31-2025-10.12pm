import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Building2, User, Filter } from "lucide-react";
import { useLocation } from "wouter";
import { CustomerHoverCard } from "@/components/CustomerHoverCard";
import { RadialContextMenu, DEFAULT_CUSTOMER_ACTIONS, type RadialAction } from "@/components/RadialContextMenu";
import { ScheduleMeetingDialog } from "@/components/ScheduleMeetingDialog";
import { CreateTaskDialog } from "@/components/CreateTaskDialog";
import { toast } from "sonner";

export default function Customers() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [customerType, setCustomerType] = useState<string>("all");
  const [businessType, setBusinessType] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; customerId: number } | null>(null);
  const [meetingDialog, setMeetingDialog] = useState<{ open: boolean; customerId: number | null }>({ open: false, customerId: null });
  const [taskDialog, setTaskDialog] = useState<{ open: boolean; customerId: number | null }>({ open: false, customerId: null });
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  const { data, isLoading } = trpc.crm.customers.list.useQuery({
    search: search || undefined,
    customerType: customerType !== "all" ? (customerType as any) : undefined,
    businessType: businessType !== "all" ? (businessType as any) : undefined,
    page,
    pageSize: 50,
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Customers</h1>
          <p className="text-muted-foreground">
            Unified contact and company management
          </p>
        </div>
        <Button onClick={() => setLocation("/crm/customers/new")}>
          <Plus className="w-4 h-4 mr-2" />
          New Customer
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Companies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.customers?.filter((c) => c.customerType === "company")
                .length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Individuals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.customers?.filter((c) => c.customerType === "individual")
                .length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Wholesale
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.customers?.filter((c) => c.businessType === "wholesale")
                .length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search customers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={customerType} onValueChange={setCustomerType}>
              <SelectTrigger>
                <SelectValue placeholder="Customer Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="individual">Individual</SelectItem>
                <SelectItem value="company">Company</SelectItem>
              </SelectContent>
            </Select>
            <Select value={businessType} onValueChange={setBusinessType}>
              <SelectTrigger>
                <SelectValue placeholder="Business Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Business Types</SelectItem>
                <SelectItem value="retail">Retail</SelectItem>
                <SelectItem value="wholesale">Wholesale</SelectItem>
                <SelectItem value="distributor">Distributor</SelectItem>
                <SelectItem value="direct">Direct</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              More Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Business Type</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : data?.customers?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    No customers found
                  </TableCell>
                </TableRow>
              ) : (
                data?.customers?.map((customer) => (
                  <CustomerHoverCard key={customer.id} customerId={customer.id}>
                    <TableRow
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setLocation(`/crm/customers/${customer.id}`)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setContextMenu({ x: e.clientX, y: e.clientY, customerId: customer.id });
                      }}
                      onDoubleClick={(e) => {
                        e.preventDefault();
                        setContextMenu({ x: e.clientX, y: e.clientY, customerId: customer.id });
                      }}
                    >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {customer.customerType === "company" ? (
                          <Building2 className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <User className="w-4 h-4 text-muted-foreground" />
                        )}
                        <div>
                          <div className="font-medium">
                            {customer.customerType === "company"
                              ? customer.companyName
                              : `${customer.firstName} ${customer.lastName}`}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {customer.customerNumber}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {customer.customerType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {customer.businessType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{customer.email}</div>
                        <div className="text-muted-foreground">
                          {customer.phone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {customer.source && (
                        <Badge variant="outline">{customer.source}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(customer.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                  </CustomerHoverCard>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Page {page} of {data.totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={() => setPage(page + 1)}
              disabled={page === data.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Radial Context Menu */}
      {contextMenu && (
        <RadialContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          actions={DEFAULT_CUSTOMER_ACTIONS.map((action) => ({
            ...action,
            onClick: () => {
              const customer = data?.customers?.find(c => c.id === contextMenu.customerId);
              switch (action.id) {
                case "edit":
                  setLocation(`/crm/customers/${contextMenu.customerId}`);
                  break;
                case "email":
                  if (customer?.email) {
                    window.location.href = `mailto:${customer.email}`;
                  } else {
                    toast.error("No email address found for this customer");
                  }
                  break;
                case "call":
                  if (customer?.phone) {
                    window.location.href = `tel:${customer.phone}`;
                  } else {
                    toast.error("No phone number found for this customer");
                  }
                  break;
                case "meeting":
                  setSelectedCustomer(customer);
                  setMeetingDialog({ open: true, customerId: contextMenu.customerId });
                  break;
                case "task":
                  setSelectedCustomer(customer);
                  setTaskDialog({ open: true, customerId: contextMenu.customerId });
                  break;
                case "delete":
                  toast.error("Delete functionality coming soon");
                  break;
              }
            },
          }))}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Meeting Dialog */}
      {meetingDialog.open && selectedCustomer && (
        <ScheduleMeetingDialog
          open={meetingDialog.open}
          onClose={() => {
            setMeetingDialog({ open: false, customerId: null });
            setSelectedCustomer(null);
          }}
          entityType="customer"
          entityId={meetingDialog.customerId!}
          entityName={selectedCustomer.companyName || `${selectedCustomer.firstName} ${selectedCustomer.lastName}`}
        />
      )}

      {/* Task Dialog */}
      {taskDialog.open && selectedCustomer && (
        <CreateTaskDialog
          open={taskDialog.open}
          onClose={() => {
            setTaskDialog({ open: false, customerId: null });
            setSelectedCustomer(null);
          }}
          entityType="customer"
          entityId={taskDialog.customerId!}
          entityName={selectedCustomer.companyName || `${selectedCustomer.firstName} ${selectedCustomer.lastName}`}
        />
      )}
    </div>
  );
}
