import { useState } from "react";
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
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, Upload, CheckCircle2, ArrowRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface EnhancedCreateCaseFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function EnhancedCreateCaseForm({ 
  open, 
  onOpenChange, 
  onSuccess 
}: EnhancedCreateCaseFormProps) {
  // Upload state
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Form data
  const [formData, setFormData] = useState({
    // Required fields
    trackingId: "",
    carrier: "FEDEX",
    adjustmentId: "",
    
    // Amounts
    originalAmount: "",
    adjustedAmount: "",
    claimedAmount: "",
    
    // Dimensions - Carrier Stated
    carrierLength: "",
    carrierWidth: "",
    carrierHeight: "",
    carrierUnit: "cm" as "cm" | "in",
    
    // Dimensions - Actual
    actualLength: "",
    actualWidth: "",
    actualHeight: "",
    actualUnit: "cm" as "cm" | "in",
    
    // Dates and details
    adjustmentDate: "",
    reason: "",
    
    // Customer info
    customerName: "",
    customerEmail: "",
    recipientAddress: "",
    orderId: "",
    
    // Shipping details
    serviceType: "",
    packageWeight: "",
    
    // Other
    notes: "",
    priority: "MEDIUM",
  });

  const createCase = trpc.cases.create.useMutation();
  const utils = trpc.useUtils();

  // Handle file drop
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith("image/"));

    if (!imageFile) {
      toast.error("Please upload an image file");
      return;
    }

    await uploadAndAnalyze(imageFile);
  };

  // Upload and analyze label
  const uploadAndAnalyze = async (file: File) => {
    setIsAnalyzing(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      // Upload file
      const formData = new FormData();
      formData.append("file", file);

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) throw new Error("Upload failed");

      const { url } = await uploadResponse.json();
      setUploadedImage(url);
      setUploadProgress(100);
      clearInterval(progressInterval);

      // Analyze label
      const analyzeResponse = await fetch("/api/analyze-label", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: url }),
      });

      if (!analyzeResponse.ok) throw new Error("Analysis failed");

      const analysis = await analyzeResponse.json();

      // Auto-fill form with analyzed data
      setFormData(prev => ({
        ...prev,
        trackingId: analysis.trackingNumber || prev.trackingId,
        carrier: analysis.carrier || prev.carrier,
        carrierLength: analysis.dimensions?.length || prev.carrierLength,
        carrierWidth: analysis.dimensions?.width || prev.carrierWidth,
        carrierHeight: analysis.dimensions?.height || prev.carrierHeight,
        carrierUnit: analysis.dimensions?.unit || prev.carrierUnit,
        packageWeight: analysis.weight || prev.packageWeight,
        serviceType: analysis.serviceType || prev.serviceType,
        recipientAddress: analysis.recipientAddress || prev.recipientAddress,
      }));

      setAnalysisComplete(true);
      toast.success("Label analyzed successfully!");
    } catch (error) {
      console.error("Upload/analysis error:", error);
      toast.error("Failed to analyze label");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Convert dimensions
  const convertDimension = (value: string, from: "cm" | "in", to: "cm" | "in") => {
    const num = parseFloat(value);
    if (isNaN(num)) return "";
    
    if (from === "cm" && to === "in") {
      return (num / 2.54).toFixed(2);
    } else if (from === "in" && to === "cm") {
      return (num * 2.54).toFixed(2);
    }
    return value;
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.trackingId || !formData.carrier) {
      toast.error("Please fill in required fields");
      return;
    }

    try {
      // Format dimensions for storage
      const carrierDimensions = formData.carrierLength && formData.carrierWidth && formData.carrierHeight
        ? `${formData.carrierLength}x${formData.carrierWidth}x${formData.carrierHeight} ${formData.carrierUnit}`
        : undefined;

      const actualDimensions = formData.actualLength && formData.actualWidth && formData.actualHeight
        ? `${formData.actualLength}x${formData.actualWidth}x${formData.actualHeight} ${formData.actualUnit}`
        : undefined;

      await createCase.mutateAsync({
        trackingId: formData.trackingId,
        carrier: formData.carrier as "FEDEX" | "UPS" | "USPS" | "DHL" | "OTHER",
        originalAmount: parseFloat(formData.originalAmount) * 100 || 0,
        adjustedAmount: parseFloat(formData.adjustedAmount) * 100 || 0,
        claimedAmount: parseFloat(formData.claimedAmount) * 100 || 0,
        carrierDimensions,
        actualDimensions,
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
        adjustmentId: "",
        originalAmount: "",
        adjustedAmount: "",
        claimedAmount: "",
        carrierLength: "",
        carrierWidth: "",
        carrierHeight: "",
        carrierUnit: "cm",
        actualLength: "",
        actualWidth: "",
        actualHeight: "",
        actualUnit: "cm",
        adjustmentDate: "",
        reason: "",
        customerName: "",
        customerEmail: "",
        recipientAddress: "",
        orderId: "",
        serviceType: "",
        packageWeight: "",
        notes: "",
        priority: "MEDIUM",
      });

      setUploadedImage(null);
      setAnalysisComplete(false);
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Failed to create case:", error);
      toast.error("Failed to create case");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Dispute Case</DialogTitle>
          <DialogDescription>
            Upload a shipping label to auto-fill details, or enter manually
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Upload Section */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging ? "border-primary bg-primary/5" : "border-border"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            {uploadedImage ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2 text-green-600">
                  <CheckCircle2 className="w-6 h-6" />
                  <span className="font-medium">Label uploaded successfully!</span>
                </div>
                <img 
                  src={uploadedImage} 
                  alt="Uploaded label" 
                  className="max-h-40 mx-auto rounded border"
                />
                {analysisComplete && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-green-800 font-medium">Label analyzed! Form auto-filled.</p>
                    <p className="text-sm text-green-600 mt-1">Review and edit fields below</p>
                  </div>
                )}
              </div>
            ) : isAnalyzing ? (
              <div className="space-y-4">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                <p className="text-sm text-muted-foreground">Analyzing label...</p>
                <Progress value={uploadProgress} className="w-full max-w-xs mx-auto" />
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Drag and drop shipping label here</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Or click to browse files
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Required Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="trackingId">
                Tracking Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="trackingId"
                value={formData.trackingId}
                onChange={(e) => setFormData({ ...formData, trackingId: e.target.value })}
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
                onValueChange={(value) => setFormData({ ...formData, carrier: value })}
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

          {/* Adjustment Details */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Adjustment Details</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="adjustmentId">Adjustment ID</Label>
                <Input
                  id="adjustmentId"
                  value={formData.adjustmentId}
                  onChange={(e) => setFormData({ ...formData, adjustmentId: e.target.value })}
                  placeholder="From Stamps.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="adjustmentDate">Adjustment Date</Label>
                <Input
                  id="adjustmentDate"
                  type="date"
                  value={formData.adjustmentDate}
                  onChange={(e) => setFormData({ ...formData, adjustmentDate: e.target.value })}
                />
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
                  onChange={(e) => setFormData({ ...formData, originalAmount: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, adjustedAmount: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, claimedAmount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Textarea
                id="reason"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="e.g., The quoted total dimensions were 233.68 x 7.62 x 7.62 (cm), the actual total dimensions received were 236.22 x 10.16 x 10.16 (cm)."
                rows={3}
              />
            </div>
          </div>

          {/* Dimensions */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Dimensions</h3>
            
            {/* Carrier Stated Dimensions */}
            <div className="space-y-2">
              <Label>Carrier Stated Dimensions</Label>
              <div className="grid grid-cols-5 gap-2">
                <Input
                  placeholder="Length"
                  type="number"
                  step="0.01"
                  value={formData.carrierLength}
                  onChange={(e) => setFormData({ ...formData, carrierLength: e.target.value })}
                />
                <Input
                  placeholder="Width"
                  type="number"
                  step="0.01"
                  value={formData.carrierWidth}
                  onChange={(e) => setFormData({ ...formData, carrierWidth: e.target.value })}
                />
                <Input
                  placeholder="Height"
                  type="number"
                  step="0.01"
                  value={formData.carrierHeight}
                  onChange={(e) => setFormData({ ...formData, carrierHeight: e.target.value })}
                />
                <Select 
                  value={formData.carrierUnit} 
                  onValueChange={(value: "cm" | "in") => setFormData({ ...formData, carrierUnit: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cm">cm</SelectItem>
                    <SelectItem value="in">in</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center justify-center text-xs text-muted-foreground">
                  {formData.carrierLength && formData.carrierUnit === "cm" && (
                    <span>{convertDimension(formData.carrierLength, "cm", "in")} in</span>
                  )}
                  {formData.carrierLength && formData.carrierUnit === "in" && (
                    <span>{convertDimension(formData.carrierLength, "in", "cm")} cm</span>
                  )}
                </div>
              </div>
            </div>

            {/* Actual Dimensions */}
            <div className="space-y-2">
              <Label>Actual Dimensions</Label>
              <div className="grid grid-cols-5 gap-2">
                <Input
                  placeholder="Length"
                  type="number"
                  step="0.01"
                  value={formData.actualLength}
                  onChange={(e) => setFormData({ ...formData, actualLength: e.target.value })}
                />
                <Input
                  placeholder="Width"
                  type="number"
                  step="0.01"
                  value={formData.actualWidth}
                  onChange={(e) => setFormData({ ...formData, actualWidth: e.target.value })}
                />
                <Input
                  placeholder="Height"
                  type="number"
                  step="0.01"
                  value={formData.actualHeight}
                  onChange={(e) => setFormData({ ...formData, actualHeight: e.target.value })}
                />
                <Select 
                  value={formData.actualUnit} 
                  onValueChange={(value: "cm" | "in") => setFormData({ ...formData, actualUnit: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cm">cm</SelectItem>
                    <SelectItem value="in">in</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center justify-center text-xs text-muted-foreground">
                  {formData.actualLength && formData.actualUnit === "cm" && (
                    <span>{convertDimension(formData.actualLength, "cm", "in")} in</span>
                  )}
                  {formData.actualLength && formData.actualUnit === "in" && (
                    <span>{convertDimension(formData.actualLength, "in", "cm")} cm</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Customer & Order Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Customer & Order Information</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerName">Customer Name</Label>
                <Input
                  id="customerName"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  placeholder="Enter customer name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="orderId">Order ID</Label>
                <Input
                  id="orderId"
                  value={formData.orderId}
                  onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
                  placeholder="Enter order ID"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipientAddress">Recipient Address</Label>
              <Textarea
                id="recipientAddress"
                value={formData.recipientAddress}
                onChange={(e) => setFormData({ ...formData, recipientAddress: e.target.value })}
                placeholder="Enter recipient address"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="serviceType">Service Type</Label>
                <Input
                  id="serviceType"
                  value={formData.serviceType}
                  onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                  placeholder="e.g., Ground, Express"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select 
                  value={formData.priority} 
                  onValueChange={(value) => setFormData({ ...formData, priority: value })}
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
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add any additional notes or details about this case..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createCase.isPending}>
              {createCase.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  Create Case
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
