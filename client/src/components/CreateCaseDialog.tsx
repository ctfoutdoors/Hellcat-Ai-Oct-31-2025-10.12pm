import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function CreateCaseDialog() {
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const [formData, setFormData] = useState({
    trackingId: "",
    carrier: "FEDEX" as "FEDEX" | "UPS" | "USPS" | "DHL" | "OTHER",
    serviceType: "",
    originalAmount: "",
    adjustedAmount: "",
    claimedAmount: "",
    actualDimensions: "",
    carrierDimensions: "",
    customerName: "",
    orderId: "",
    notes: "",
  });

  const createMutation = trpc.cases.create.useMutation({
    onSuccess: (data) => {
      toast.success("Case created successfully!");
      utils.cases.list.invalidate();
      utils.cases.getById.invalidate();
      setOpen(false);
      resetForm();
      // Navigate to the new case
      if (data.id) {
        setLocation(`/cases/${data.id}`);
      }
    },
    onError: (error) => {
      toast.error(`Failed to create case: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      trackingId: "",
      carrier: "FEDEX",
      serviceType: "",
      originalAmount: "",
      adjustedAmount: "",
      claimedAmount: "",
      actualDimensions: "",
      carrierDimensions: "",
      customerName: "",
      orderId: "",
      notes: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.trackingId) {
      toast.error("Tracking ID is required");
      return;
    }

    if (!formData.originalAmount || !formData.adjustedAmount || !formData.claimedAmount) {
      toast.error("All amount fields are required");
      return;
    }

    // Convert amounts to cents
    const originalAmount = Math.round(parseFloat(formData.originalAmount) * 100);
    const adjustedAmount = Math.round(parseFloat(formData.adjustedAmount) * 100);
    const claimedAmount = Math.round(parseFloat(formData.claimedAmount) * 100);

    if (isNaN(originalAmount) || isNaN(adjustedAmount) || isNaN(claimedAmount)) {
      toast.error("Please enter valid amounts");
      return;
    }

    createMutation.mutate({
      trackingId: formData.trackingId,
      carrier: formData.carrier,
      serviceType: formData.serviceType || undefined,
      originalAmount,
      adjustedAmount,
      claimedAmount,
      actualDimensions: formData.actualDimensions || undefined,
      carrierDimensions: formData.carrierDimensions || undefined,
      customerName: formData.customerName || undefined,
      orderId: formData.orderId || undefined,
      notes: formData.notes || undefined,
    });
  };

  // Auto-calculate claimed amount when original and adjusted are entered
  const handleAmountChange = (field: "originalAmount" | "adjustedAmount", value: string) => {
    const newFormData = { ...formData, [field]: value };
    
    if (newFormData.originalAmount && newFormData.adjustedAmount) {
      const original = parseFloat(newFormData.originalAmount);
      const adjusted = parseFloat(newFormData.adjustedAmount);
      
      if (!isNaN(original) && !isNaN(adjusted) && adjusted > original) {
        newFormData.claimedAmount = (adjusted - original).toFixed(2);
      }
    }
    
    setFormData(newFormData);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Case
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Dispute Case</DialogTitle>
            <DialogDescription>
              Enter the details of the carrier adjustment dispute
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Tracking Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Tracking Information</h3>
              
              <div className="grid gap-2">
                <Label htmlFor="trackingId">
                  Tracking ID <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="trackingId"
                  value={formData.trackingId}
                  onChange={(e) => setFormData({ ...formData, trackingId: e.target.value })}
                  placeholder="Enter tracking number"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="carrier">
                    Carrier <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.carrier}
                    onValueChange={(value: any) => setFormData({ ...formData, carrier: value })}
                  >
                    <SelectTrigger id="carrier">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FEDEX">FedEx</SelectItem>
                      <SelectItem value="UPS">UPS</SelectItem>
                      <SelectItem value="USPS">USPS</SelectItem>
                      <SelectItem value="DHL">DHL</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="serviceType">Service Type</Label>
                  <Input
                    id="serviceType"
                    value={formData.serviceType}
                    onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                    placeholder="e.g., Ground, Express"
                  />
                </div>
              </div>
            </div>

            {/* Financial Details */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Financial Details</h3>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="originalAmount">
                    Original Amount <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="originalAmount"
                    type="number"
                    step="0.01"
                    value={formData.originalAmount}
                    onChange={(e) => handleAmountChange("originalAmount", e.target.value)}
                    placeholder="0.00"
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="adjustedAmount">
                    Adjusted Amount <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="adjustedAmount"
                    type="number"
                    step="0.01"
                    value={formData.adjustedAmount}
                    onChange={(e) => handleAmountChange("adjustedAmount", e.target.value)}
                    placeholder="0.00"
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="claimedAmount">
                    Claimed Amount <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="claimedAmount"
                    type="number"
                    step="0.01"
                    value={formData.claimedAmount}
                    onChange={(e) => setFormData({ ...formData, claimedAmount: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Claimed amount will auto-calculate as the difference between adjusted and original
              </p>
            </div>

            {/* Dimensions */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Package Dimensions</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="actualDimensions">Actual Dimensions</Label>
                  <Input
                    id="actualDimensions"
                    value={formData.actualDimensions}
                    onChange={(e) => setFormData({ ...formData, actualDimensions: e.target.value })}
                    placeholder="e.g., 12x8x6 inches"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="carrierDimensions">Carrier Stated Dimensions</Label>
                  <Input
                    id="carrierDimensions"
                    value={formData.carrierDimensions}
                    onChange={(e) => setFormData({ ...formData, carrierDimensions: e.target.value })}
                    placeholder="e.g., 14x10x8 inches"
                  />
                </div>
              </div>
            </div>

            {/* Customer Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Customer Information (Optional)</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="customerName">Customer Name</Label>
                  <Input
                    id="customerName"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="orderId">Order ID</Label>
                  <Input
                    id="orderId"
                    value={formData.orderId}
                    onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
                    placeholder="ORD-12345"
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional details about this dispute..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
                resetForm();
              }}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Case"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
