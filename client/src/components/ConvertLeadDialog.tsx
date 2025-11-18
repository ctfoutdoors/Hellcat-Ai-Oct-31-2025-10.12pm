import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useLocation } from "wouter";

interface ConvertLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: {
    id: number;
    firstName?: string | null;
    lastName?: string | null;
    companyName?: string | null;
    email?: string | null;
    phone?: string | null;
    leadType: string;
  };
}

export function ConvertLeadDialog({ open, onOpenChange, lead }: ConvertLeadDialogProps) {
  const [, setLocation] = useLocation();
  const [createOpportunity, setCreateOpportunity] = useState(true);
  const [customerType, setCustomerType] = useState<"individual" | "company">(
    lead.companyName ? "company" : "individual"
  );

  const utils = trpc.useUtils();
  
  const convertMutation = trpc.crm.leads.convertToCustomer.useMutation({
    onSuccess: (data) => {
      toast.success("Lead converted to customer successfully!");
      utils.crm.leads.list.invalidate();
      utils.crm.customers.list.invalidate();
      onOpenChange(false);
      
      // Navigate to new customer page
      if (data.customerId) {
        setLocation(`/crm/customers/${data.customerId}`);
      }
    },
    onError: (error) => {
      toast.error(`Failed to convert lead: ${error.message}`);
    },
  });

  const handleConvert = () => {
    convertMutation.mutate({
      leadId: lead.id,
      customerType,
      createOpportunity,
    });
  };

  const displayName = lead.companyName || `${lead.firstName || ''} ${lead.lastName || ''}`.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Convert Lead to Customer</DialogTitle>
          <DialogDescription>
            Convert "{displayName}" from a lead to an active customer in your CRM.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Customer Type</Label>
            <Select
              value={customerType}
              onValueChange={(value: "individual" | "company") => setCustomerType(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="individual">Individual</SelectItem>
                <SelectItem value="company">Company</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Contact Information</Label>
            <div className="text-sm text-muted-foreground space-y-1">
              {lead.email && <div>Email: {lead.email}</div>}
              {lead.phone && <div>Phone: {lead.phone}</div>}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="create-opportunity"
              checked={createOpportunity}
              onCheckedChange={(checked) => setCreateOpportunity(checked as boolean)}
            />
            <Label
              htmlFor="create-opportunity"
              className="text-sm font-normal cursor-pointer"
            >
              Create an opportunity for this customer
            </Label>
          </div>

          <div className="rounded-lg bg-muted p-3 text-sm">
            <p className="font-medium mb-1">What happens next:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Lead status will be set to "Won"</li>
              <li>A new customer record will be created</li>
              <li>All lead activities will be transferred</li>
              {createOpportunity && <li>A new opportunity will be created</li>}
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={convertMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConvert}
            disabled={convertMutation.isPending}
          >
            {convertMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Convert to Customer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
