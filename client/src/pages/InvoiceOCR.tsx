import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Upload, FileText, CheckCircle2, AlertCircle, Loader2, 
  DollarSign, Calendar, Building2, Hash, Sparkles, Download
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface ExtractedData {
  vendor: string;
  invoiceNumber: string;
  date: string;
  totalAmount: string;
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPrice: string;
    total: string;
  }>;
  confidence: {
    overall: number;
    vendor: number;
    amount: number;
    date: number;
  };
}

export default function InvoiceOCR() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
    if (!validTypes.includes(selectedFile.type)) {
      toast.error("Please upload a valid image (JPG, PNG) or PDF file");
      return;
    }

    // Validate file size (10MB max)
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    setFile(selectedFile);
    
    // Create preview for images
    if (selectedFile.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(null);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      const fakeEvent = {
        target: { files: [droppedFile] },
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      handleFileSelect(fakeEvent);
    }
  }, [handleFileSelect]);

  const processInvoice = async () => {
    if (!file) return;

    setIsProcessing(true);
    
    // Simulate AI processing (in real implementation, this would call the backend)
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock extracted data
    const mockData: ExtractedData = {
      vendor: "Uline Corporation",
      invoiceNumber: "INV-2025-" + Math.floor(Math.random() * 10000),
      date: new Date().toISOString().split("T")[0],
      totalAmount: "$" + (Math.random() * 5000 + 500).toFixed(2),
      lineItems: [
        {
          description: "Shipping Boxes - Large (24x18x12)",
          quantity: 50,
          unitPrice: "$12.50",
          total: "$625.00",
        },
        {
          description: "Bubble Wrap Roll - 12\" x 250'",
          quantity: 10,
          unitPrice: "$28.75",
          total: "$287.50",
        },
        {
          description: "Packing Tape - 2\" x 110 yards",
          quantity: 24,
          unitPrice: "$3.25",
          total: "$78.00",
        },
      ],
      confidence: {
        overall: 94,
        vendor: 98,
        amount: 92,
        date: 96,
      },
    };

    setExtractedData(mockData);
    setIsProcessing(false);
    toast.success("Invoice processed successfully!");
  };

  const createPOFromInvoice = () => {
    if (!extractedData) return;
    toast.success(`Purchase Order created for ${extractedData.vendor}`);
    // In real implementation, this would navigate to PO creation with pre-filled data
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return "text-green-500";
    if (confidence >= 75) return "text-yellow-500";
    return "text-red-500";
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 90) return "default";
    if (confidence >= 75) return "secondary";
    return "destructive";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Sparkles className="text-primary" />
          AI Invoice OCR
        </h1>
        <p className="text-muted-foreground mt-2">
          Upload invoices to automatically extract vendor, amounts, and line items using AI
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle>Upload Invoice</CardTitle>
            <CardDescription>
              Supports PDF, JPG, PNG (Max 10MB)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Drag & Drop Zone */}
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
              onClick={() => document.getElementById("file-input")?.click()}
            >
              <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm font-medium mb-1">
                {file ? file.name : "Click to upload or drag and drop"}
              </p>
              <p className="text-xs text-muted-foreground">
                PDF, JPG, PNG up to 10MB
              </p>
              <input
                id="file-input"
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {/* Preview */}
            {preview && (
              <div className="relative">
                <img 
                  src={preview} 
                  alt="Invoice preview" 
                  className="w-full h-64 object-contain rounded-lg border border-border"
                />
              </div>
            )}

            {file && !preview && (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted">
                <FileText className="text-primary" size={32} />
                <div className="flex-1">
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
            )}

            {/* Process Button */}
            <Button 
              onClick={processInvoice} 
              disabled={!file || isProcessing}
              className="w-full"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing with AI...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Extract Data with AI
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Extracted Data Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Extracted Data
              {extractedData && (
                <Badge variant={getConfidenceBadge(extractedData.confidence.overall)}>
                  {extractedData.confidence.overall}% Confidence
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              AI-extracted invoice information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!extractedData && !isProcessing && (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>Upload and process an invoice to see extracted data</p>
              </div>
            )}

            {isProcessing && (
              <div className="text-center py-12">
                <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">AI is analyzing your invoice...</p>
              </div>
            )}

            {extractedData && (
              <div className="space-y-4">
                {/* Key Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Building2 size={16} />
                      Vendor
                      <Badge variant="outline" className={getConfidenceColor(extractedData.confidence.vendor)}>
                        {extractedData.confidence.vendor}%
                      </Badge>
                    </Label>
                    <Input value={extractedData.vendor} readOnly />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Hash size={16} />
                      Invoice #
                    </Label>
                    <Input value={extractedData.invoiceNumber} readOnly />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Calendar size={16} />
                      Date
                      <Badge variant="outline" className={getConfidenceColor(extractedData.confidence.date)}>
                        {extractedData.confidence.date}%
                      </Badge>
                    </Label>
                    <Input value={extractedData.date} readOnly />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <DollarSign size={16} />
                      Total Amount
                      <Badge variant="outline" className={getConfidenceColor(extractedData.confidence.amount)}>
                        {extractedData.confidence.amount}%
                      </Badge>
                    </Label>
                    <Input value={extractedData.totalAmount} readOnly className="font-bold" />
                  </div>
                </div>

                {/* Line Items */}
                <div className="space-y-2">
                  <Label>Line Items ({extractedData.lineItems.length})</Label>
                  <div className="border rounded-lg divide-y">
                    {extractedData.lineItems.map((item, index) => (
                      <div key={index} className="p-3 space-y-1">
                        <div className="flex justify-between items-start">
                          <p className="font-medium text-sm">{item.description}</p>
                          <p className="font-bold">{item.total}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Qty: {item.quantity} × {item.unitPrice}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4">
                  <Button onClick={createPOFromInvoice} className="flex-1">
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Create Purchase Order
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Download className="mr-2 h-4 w-4" />
                    Export Data
                  </Button>
                </div>

                {/* Confidence Alert */}
                {extractedData.confidence.overall < 90 && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/10 text-yellow-600 dark:text-yellow-500">
                    <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                    <p className="text-sm">
                      Some fields have lower confidence. Please review extracted data before creating PO.
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle>How AI Invoice OCR Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Upload className="text-primary" size={20} />
              </div>
              <h4 className="font-semibold mb-1">1. Upload</h4>
              <p className="text-sm text-muted-foreground">
                Upload invoice PDF or image
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Sparkles className="text-primary" size={20} />
              </div>
              <h4 className="font-semibold mb-1">2. AI Analysis</h4>
              <p className="text-sm text-muted-foreground">
                AI extracts key information
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="text-primary" size={20} />
              </div>
              <h4 className="font-semibold mb-1">3. Review</h4>
              <p className="text-sm text-muted-foreground">
                Verify extracted data
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <FileText className="text-primary" size={20} />
              </div>
              <h4 className="font-semibold mb-1">4. Create PO</h4>
              <p className="text-sm text-muted-foreground">
                Auto-generate purchase order
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
