
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import DocumentUpload from "@/components/DocumentUpload";

export default function NewCase() {
  const [, setLocation] = useLocation();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [caseType, setCaseType] = useState("");
  const [carrier, setCarrier] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [claimAmount, setClaimAmount] = useState("");
  const [priority, setPriority] = useState<string>("medium");
  const [extractionId, setExtractionId] = useState<number | undefined>();

  const createCaseMutation = trpc.cases.create.useMutation({
    onSuccess: (data) => {
      toast.success("Case created successfully!");
      setLocation(`/cases/${data.id}`);
    },
    onError: (error) => {
      toast.error(`Failed to create case: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error("Please enter a case title");
      return;
    }
    
    if (!caseType) {
      toast.error("Please select a case type");
      return;
    }

    createCaseMutation.mutate({
      title: title.trim(),
      description: description.trim() || undefined,
      caseType,
      carrier: carrier || undefined,
      trackingNumber: trackingNumber.trim() || undefined,
      claimAmount: claimAmount || undefined,
      priority: priority as "low" | "medium" | "high" | "urgent",
    });
  };

  const handleDataExtracted = (data: any) => {
    if (data.title) setTitle(data.title);
    if (data.description) setDescription(data.description);
    if (data.caseType) setCaseType(data.caseType);
    if (data.carrier) setCarrier(data.carrier);
    if (data.trackingNumber) setTrackingNumber(data.trackingNumber);
    if (data.claimAmount) setClaimAmount(data.claimAmount);
    if (data.priority) setPriority(data.priority);
    if (data.extractionId) setExtractionId(data.extractionId);
  };

  return (
      <div className="max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Create New Case</h1>
          <p className="text-muted-foreground mt-2">
            File a new carrier dispute or claim
          </p>
        </div>

        {/* AI Document Upload */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">AI-Powered Document Upload</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Upload a carrier document (invoice, tracking report, email) and let AI extract the case information automatically.
          </p>
          <DocumentUpload onDataExtracted={handleDataExtracted} />
        </div>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or enter manually
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Case Information</CardTitle>
              <CardDescription>
                Enter the details of your carrier dispute case
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">
                  Case Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="e.g., FedEx Package Damage Claim - Order #12345"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the issue in detail..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="caseType">
                    Case Type <span className="text-red-500">*</span>
                  </Label>
                  <Select value={caseType} onValueChange={setCaseType} required>
                    <SelectTrigger id="caseType">
                      <SelectValue placeholder="Select case type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="adjustments">Adjustments Claims</SelectItem>
                      <SelectItem value="damages">Shipping Damages</SelectItem>
                      <SelectItem value="sla">Shipping SLA Claims</SelectItem>
                      <SelectItem value="lost_package">Lost Package</SelectItem>
                      <SelectItem value="billing_dispute">Billing Dispute</SelectItem>
                      <SelectItem value="refund_request">Refund Request</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger id="priority">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="carrier">Carrier</Label>
                  <Select value={carrier} onValueChange={setCarrier}>
                    <SelectTrigger id="carrier">
                      <SelectValue placeholder="Select carrier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fedex">FedEx</SelectItem>
                      <SelectItem value="ups">UPS</SelectItem>
                      <SelectItem value="usps">USPS</SelectItem>
                      <SelectItem value="dhl">DHL</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="trackingNumber">Tracking Number</Label>
                  <Input
                    id="trackingNumber"
                    placeholder="e.g., 1Z999AA10123456784"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="claimAmount">Claim Amount ($)</Label>
                <Input
                  id="claimAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={claimAmount}
                  onChange={(e) => setClaimAmount(e.target.value)}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={createCaseMutation.isPending}
                >
                  {createCaseMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create Case
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/cases")}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
  );
}
