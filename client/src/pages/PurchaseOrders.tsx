import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Plus, Search } from "lucide-react";
import { toast } from "sonner";

type POStatus = "Pending" | "Approved" | "Shipped" | "Received" | "Cancelled";

interface PurchaseOrder {
  poNumber: string;
  vendor: string;
  date: string;
  status: POStatus;
  amount: string;
}

export default function PurchaseOrders() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [pos, setPOs] = useState<PurchaseOrder[]>([
    { poNumber: "PO-2025-001", vendor: "Uline", date: "2025-01-15", status: "Pending", amount: "$2,450.00" },
    { poNumber: "PO-2025-002", vendor: "Grainger", date: "2025-01-18", status: "Shipped", amount: "$1,875.50" },
    { poNumber: "PO-2025-003", vendor: "Staples", date: "2025-01-20", status: "Received", amount: "$892.25" },
  ]);

  // Form state
  const [formData, setFormData] = useState({
    vendor: "",
    amount: "",
    status: "Pending" as POStatus,
    notes: "",
  });

  const filteredPOs = pos.filter((po) => {
    const query = searchQuery.toLowerCase();
    return (
      po.vendor.toLowerCase().includes(query) ||
      po.poNumber.toLowerCase().includes(query)
    );
  });

  const getStatusVariant = (status: POStatus): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "Received":
        return "default";
      case "Shipped":
        return "secondary";
      case "Pending":
        return "outline";
      case "Cancelled":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const handleCreatePO = () => {
    if (!formData.vendor || !formData.amount) {
      toast.error("Please fill in all required fields");
      return;
    }

    const newPO: PurchaseOrder = {
      poNumber: `PO-2025-${String(pos.length + 1).padStart(3, "0")}`,
      vendor: formData.vendor,
      date: new Date().toISOString().split("T")[0],
      status: formData.status,
      amount: formData.amount.startsWith("$") ? formData.amount : `$${formData.amount}`,
    };

    setPOs([newPO, ...pos]);
    setIsDialogOpen(false);
    setFormData({ vendor: "", amount: "", status: "Pending", notes: "" });
    toast.success(`Purchase Order ${newPO.poNumber} created successfully`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Purchase Orders</h1>
          <p className="text-muted-foreground mt-2">Manage vendor purchase orders</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New PO
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create Purchase Order</DialogTitle>
              <DialogDescription>
                Enter the details for the new purchase order.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="vendor">Vendor Name *</Label>
                <Input
                  id="vendor"
                  placeholder="e.g., Uline, Grainger, Staples"
                  value={formData.vendor}
                  onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="amount">Amount *</Label>
                <Input
                  id="amount"
                  placeholder="e.g., 1500.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: POStatus) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Approved">Approved</SelectItem>
                    <SelectItem value="Shipped">Shipped</SelectItem>
                    <SelectItem value="Received">Received</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Input
                  id="notes"
                  placeholder="Additional notes..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreatePO}>Create PO</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by vendor name or PO number..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* PO List */}
      <div className="grid gap-4">
        {filteredPOs.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No purchase orders found matching "{searchQuery}"
            </CardContent>
          </Card>
        ) : (
          filteredPOs.map((po) => (
            <Card key={po.poNumber} className="cursor-pointer hover:border-primary transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5" />
                    <div>
                      <div>{po.poNumber}</div>
                      <div className="text-sm text-muted-foreground font-normal">{po.vendor}</div>
                    </div>
                  </div>
                  <Badge variant={getStatusVariant(po.status)}>{po.status}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between text-sm">
                  <div>
                    <span className="text-muted-foreground">Date:</span> {po.date}
                  </div>
                  <div className="font-bold">{po.amount}</div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
