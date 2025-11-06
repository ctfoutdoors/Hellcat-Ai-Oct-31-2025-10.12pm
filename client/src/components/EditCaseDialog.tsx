import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface EditCaseDialogProps {
  caseId: number;
  caseData: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function EditCaseDialog({ caseId, caseData, open, onOpenChange, onSuccess }: EditCaseDialogProps) {
  const [formData, setFormData] = useState({
    trackingId: "",
    carrier: "FEDEX",
    status: "DRAFT",
    priority: "MEDIUM",
    originalAmount: "",
    adjustedAmount: "",
    claimedAmount: "",
    recoveredAmount: "",
    actualDimensions: "",
    carrierDimensions: "",
    customerName: "",
    orderId: "",
    serviceType: "",
    productSkus: "",
    notes: "",
  });

  useEffect(() => {
    if (caseData) {
      setFormData({
        trackingId: caseData.trackingId || "",
        carrier: caseData.carrier || "FEDEX",
        status: caseData.status || "DRAFT",
        priority: caseData.priority || "MEDIUM",
        originalAmount: (caseData.originalAmount / 100).toString(),
        adjustedAmount: (caseData.adjustedAmount / 100).toString(),
        claimedAmount: (caseData.claimedAmount / 100).toString(),
        recoveredAmount: (caseData.recoveredAmount / 100).toString(),
        actualDimensions: caseData.actualDimensions || "",
        carrierDimensions: caseData.carrierDimensions || "",
        customerName: caseData.customerName || "",
        orderId: caseData.orderId || "",
        serviceType: caseData.serviceType || "",
        productSkus: caseData.productSkus || "",
        notes: caseData.notes || "",
      });
    }
  }, [caseData]);

  const updateCase = trpc.cases.update.useMutation();
  const utils = trpc.useUtils();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await updateCase.mutateAsync({
        id: caseId,
        trackingId: formData.trackingId,
        carrier: formData.carrier as any,
        status: formData.status as any,
        priority: formData.priority as any,
        originalAmount: Math.round(parseFloat(formData.originalAmount) * 100),
        adjustedAmount: Math.round(parseFloat(formData.adjustedAmount) * 100),
        claimedAmount: Math.round(parseFloat(formData.claimedAmount) * 100),
        recoveredAmount: Math.round(parseFloat(formData.recoveredAmount) * 100),
        actualDimensions: formData.actualDimensions || undefined,
        carrierDimensions: formData.carrierDimensions || undefined,
        customerName: formData.customerName || undefined,
        orderId: formData.orderId || undefined,
        serviceType: formData.serviceType || undefined,
        productSkus: formData.productSkus || undefined,
        notes: formData.notes || undefined,
      });

      toast.success("Case updated successfully!");
      utils.cases.invalidate();
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to update case");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Case</DialogTitle>
          <DialogDescription>
            Update case details and information
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="trackingId">Tracking ID *</Label>
              <Input
                id="trackingId"
                value={formData.trackingId}
                onChange={(e) => setFormData({ ...formData, trackingId: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="carrier">Carrier *</Label>
              <Select value={formData.carrier} onValueChange={(value) => setFormData({ ...formData, carrier: value })}>
                <SelectTrigger>
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

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="FILED">Filed</SelectItem>
                  <SelectItem value="AWAITING_RESPONSE">Awaiting Response</SelectItem>
                  <SelectItem value="RESOLVED">Resolved</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="originalAmount">Original Amount ($) *</Label>
              <Input
                id="originalAmount"
                type="number"
                step="0.01"
                value={formData.originalAmount}
                onChange={(e) => setFormData({ ...formData, originalAmount: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="adjustedAmount">Adjusted Amount ($) *</Label>
              <Input
                id="adjustedAmount"
                type="number"
                step="0.01"
                value={formData.adjustedAmount}
                onChange={(e) => setFormData({ ...formData, adjustedAmount: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="claimedAmount">Claimed Amount ($) *</Label>
              <Input
                id="claimedAmount"
                type="number"
                step="0.01"
                value={formData.claimedAmount}
                onChange={(e) => setFormData({ ...formData, claimedAmount: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recoveredAmount">Recovered Amount ($)</Label>
              <Input
                id="recoveredAmount"
                type="number"
                step="0.01"
                value={formData.recoveredAmount}
                onChange={(e) => setFormData({ ...formData, recoveredAmount: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="serviceType">Service Type</Label>
              <Input
                id="serviceType"
                value={formData.serviceType}
                onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                placeholder="e.g., Ground, Express, Priority"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerName">Customer Name</Label>
              <Input
                id="customerName"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="orderId">Order ID</Label>
              <Input
                id="orderId"
                value={formData.orderId}
                onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="productSkus">Product SKUs</Label>
              <Input
                id="productSkus"
                value={formData.productSkus}
                onChange={(e) => setFormData({ ...formData, productSkus: e.target.value })}
                placeholder="Comma-separated SKUs"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="actualDimensions">Actual Dimensions</Label>
              <Input
                id="actualDimensions"
                value={formData.actualDimensions}
                onChange={(e) => setFormData({ ...formData, actualDimensions: e.target.value })}
                placeholder="e.g., 12x10x8"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="carrierDimensions">Carrier Dimensions</Label>
              <Input
                id="carrierDimensions"
                value={formData.carrierDimensions}
                onChange={(e) => setFormData({ ...formData, carrierDimensions: e.target.value })}
                placeholder="e.g., 15x12x10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="Additional notes or details about this case..."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateCase.isPending}>
              {updateCase.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Case
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
