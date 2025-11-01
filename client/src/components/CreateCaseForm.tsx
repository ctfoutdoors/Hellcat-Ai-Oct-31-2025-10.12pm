import React, { useState } from "react";
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
import { Loader2, Upload, Image as ImageIcon, CheckCircle2 } from "lucide-react";

interface CreateCaseFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function CreateCaseForm({ open, onOpenChange, onSuccess }: CreateCaseFormProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [formData, setFormData] = useState({
    trackingId: "",
    carrier: "FEDEX",
    originalAmount: "",
    adjustedAmount: "",
    claimedAmount: "",
    actualDimensions: "",
    carrierDimensions: "",
    customerName: "",
    orderId: "",
    serviceType: "",
    notes: "",
    priority: "MEDIUM",
  });

  const createCase = trpc.cases.create.useMutation();
  const utils = trpc.useUtils();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.trackingId || !formData.carrier) {
      toast.error("Please fill in required fields");
      return;
    }

    try {
      await createCase.mutateAsync({
        trackingId: formData.trackingId,
        carrier: formData.carrier as "FEDEX" | "UPS" | "USPS" | "DHL" | "OTHER",
        originalAmount: parseFloat(formData.originalAmount) * 100 || 0,
        adjustedAmount: parseFloat(formData.adjustedAmount) * 100 || 0,
        claimedAmount: parseFloat(formData.claimedAmount) * 100 || 0,
        actualDimensions: formData.actualDimensions || undefined,
        carrierDimensions: formData.carrierDimensions || undefined,
        customerName: formData.customerName || undefined,
        orderId: formData.orderId || undefined,
        serviceType: formData.serviceType || undefined,
        notes: formData.notes || undefined,
        priority: formData.priority as "LOW" | "MEDIUM" | "HIGH" | "URGENT",
      });

      toast.success("Case created successfully");
      utils.cases.list.invalidate();
      
      // Reset form
      setFormData({
        trackingId: "",
        carrier: "FEDEX",
        originalAmount: "",
        adjustedAmount: "",
        claimedAmount: "",
        actualDimensions: "",
        carrierDimensions: "",
        customerName: "",
        orderId: "",
        serviceType: "",
        notes: "",
        priority: "MEDIUM",
      });

      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Failed to create case:", error);
      toast.error("Failed to create case");
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Case</DialogTitle>
          <DialogDescription>
            Enter the details for the carrier dispute case
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Drag & Drop Image Analysis Zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              isDragging
                ? "border-primary bg-primary/5"
                : "border-gray-300 hover:border-primary/50"
            } ${uploadedImage ? "bg-green-50 border-green-500" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={async (e) => {
              e.preventDefault();
              setIsDragging(false);
              
              const files = Array.from(e.dataTransfer.files);
              const imageFile = files.find(f => f.type.startsWith('image/'));
              
              if (imageFile) {
                setIsAnalyzing(true);
                setAnalysisComplete(false);
                
                try {
                  // Upload image to S3
                  const formData = new FormData();
                  formData.append('file', imageFile);
                  
                  const uploadRes = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData,
                  });
                  
                  const { url } = await uploadRes.json();
                  setUploadedImage(url);
                  
                  // Analyze image with AI
                  const analysisRes = await fetch('/api/ai/analyze-label', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ imageUrl: url }),
                  });
                  
                  const analysis = await analysisRes.json();
                  
                  // Auto-fill form fields
                  if (analysis.trackingNumber) {
                    handleChange('trackingId', analysis.trackingNumber);
                  }
                  if (analysis.carrier) {
                    handleChange('carrier', analysis.carrier);
                  }
                  if (analysis.dimensions) {
                    handleChange('carrierDimensions', analysis.dimensions);
                  }
                  if (analysis.weight) {
                    handleChange('actualDimensions', `${analysis.dimensions} (${analysis.weight})`);
                  }
                  
                  // Fetch ShipStation data if tracking found
                  if (analysis.trackingNumber) {
                    const shipstationRes = await fetch(`/api/shipstation/lookup?tracking=${analysis.trackingNumber}`);
                    const shipment = await shipstationRes.json();
                    
                    if (shipment) {
                      handleChange('customerName', shipment.shipTo?.name || '');
                      handleChange('orderId', shipment.orderNumber || '');
                      handleChange('serviceType', shipment.serviceCode || '');
                      handleChange('originalAmount', shipment.shipmentCost?.toString() || '');
                      
                      if (shipment.dimensions) {
                        const dims = `${shipment.dimensions.length}x${shipment.dimensions.width}x${shipment.dimensions.height}`;
                        handleChange('actualDimensions', dims);
                      }
                    }
                  }
                  
                  setAnalysisComplete(true);
                  toast.success('Label analyzed and form auto-filled!');
                } catch (error) {
                  console.error('Image analysis failed:', error);
                  toast.error('Failed to analyze image');
                } finally {
                  setIsAnalyzing(false);
                }
              }
            }}
          >
            {isAnalyzing ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-gray-600">Analyzing shipping label...</p>
              </div>
            ) : analysisComplete ? (
              <div className="flex flex-col items-center gap-2">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
                <p className="text-sm font-medium text-green-700">Label analyzed! Form auto-filled.</p>
                <p className="text-xs text-gray-500">Review and edit fields below</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                {uploadedImage ? (
                  <ImageIcon className="h-8 w-8 text-green-600" />
                ) : (
                  <Upload className="h-8 w-8 text-gray-400" />
                )}
                <p className="text-sm font-medium text-gray-700">
                  {uploadedImage ? 'Image uploaded' : 'Drag & drop shipping label here'}
                </p>
                <p className="text-xs text-gray-500">
                  Auto-extract tracking, carrier, dimensions & pull ShipStation data
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="trackingId">
                Tracking Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="trackingId"
                value={formData.trackingId}
                onChange={(e) => handleChange("trackingId", e.target.value)}
                placeholder="Enter tracking number"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="carrier">
                Carrier <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.carrier}
                onValueChange={(value) => handleChange("carrier", value)}
              >
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
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="originalAmount">Original Amount ($)</Label>
              <Input
                id="originalAmount"
                type="number"
                step="0.01"
                value={formData.originalAmount}
                onChange={(e) => handleChange("originalAmount", e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="adjustedAmount">Adjusted Amount ($)</Label>
              <Input
                id="adjustedAmount"
                type="number"
                step="0.01"
                value={formData.adjustedAmount}
                onChange={(e) => handleChange("adjustedAmount", e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="claimedAmount">Claimed Amount ($)</Label>
              <Input
                id="claimedAmount"
                type="number"
                step="0.01"
                value={formData.claimedAmount}
                onChange={(e) => handleChange("claimedAmount", e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="actualDimensions">Actual Dimensions</Label>
              <Input
                id="actualDimensions"
                value={formData.actualDimensions}
                onChange={(e) => handleChange("actualDimensions", e.target.value)}
                placeholder="e.g., 12x10x8"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="carrierDimensions">Carrier Stated Dimensions</Label>
              <Input
                id="carrierDimensions"
                value={formData.carrierDimensions}
                onChange={(e) => handleChange("carrierDimensions", e.target.value)}
                placeholder="e.g., 14x12x10"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customerName">Customer Name</Label>
              <Input
                id="customerName"
                value={formData.customerName}
                onChange={(e) => handleChange("customerName", e.target.value)}
                placeholder="Enter customer name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="orderId">Order ID</Label>
              <Input
                id="orderId"
                value={formData.orderId}
                onChange={(e) => handleChange("orderId", e.target.value)}
                placeholder="Enter order ID"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="serviceType">Service Type</Label>
              <Input
                id="serviceType"
                value={formData.serviceType}
                onChange={(e) => handleChange("serviceType", e.target.value)}
                placeholder="e.g., Ground, Express"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => handleChange("priority", value)}
              >
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Add any additional notes or details about this case..."
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createCase.isPending}>
              {createCase.isPending ? (
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
