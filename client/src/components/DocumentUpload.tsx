import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Upload, FileText, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useState, useCallback } from "react";
import { toast } from "sonner";

interface ExtractedData {
  title?: string;
  description?: string;
  caseType?: string;
  carrier?: string;
  trackingNumber?: string;
  claimAmount?: string;
  priority?: string;
  confidence: Record<string, number>;
  extractionId?: number;
}

interface DocumentUploadProps {
  onDataExtracted: (data: ExtractedData & { extractionId?: number }) => void;
}

export default function DocumentUpload({ onDataExtracted }: DocumentUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);

  const extractMutation = trpc.cases.extractFromDocument.useMutation({
    onSuccess: (data) => {
      setExtractedData(data);
      setIsExtracting(false);
      toast.success("Document processed successfully!");
    },
    onError: (error) => {
      setIsExtracting(false);
      toast.error(`Failed to extract data: ${error.message}`);
    },
  });

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    // Validate file type
    const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload a PDF or image file");
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    setUploadedFile(file);
    setIsExtracting(true);
    setExtractedData(null);

    // Convert file to base64 for transmission
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      extractMutation.mutate({
        fileName: file.name,
        fileType: file.type,
        fileData: base64,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleUseExtractedData = () => {
    if (extractedData) {
      onDataExtracted(extractedData);
      toast.success("Form filled with extracted data");
    }
  };

  const handleReset = () => {
    setUploadedFile(null);
    setExtractedData(null);
    setIsExtracting(false);
  };

  return (
    <Card className="border-2 border-dashed">
      <CardContent className="p-6">
        {!uploadedFile ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`flex flex-col items-center justify-center py-12 px-6 rounded-lg transition-colors ${
              isDragging
                ? "bg-primary/10 border-primary"
                : "bg-muted/30 hover:bg-muted/50"
            }`}
          >
            <Upload className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Upload Carrier Document
            </h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              Drag & drop or click to upload invoices, tracking reports, or emails
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              Supported: PDF, PNG, JPG (max 10MB)
            </p>
            <label htmlFor="file-upload">
              <Button type="button" variant="outline" asChild>
                <span>
                  <Upload className="mr-2 h-4 w-4" />
                  Choose File
                </span>
              </Button>
            </label>
            <input
              id="file-upload"
              type="file"
              className="hidden"
              accept=".pdf,.png,.jpg,.jpeg,.webp"
              onChange={handleFileSelect}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
              <FileText className="h-8 w-8 text-primary" />
              <div className="flex-1">
                <p className="font-medium">{uploadedFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(uploadedFile.size / 1024).toFixed(2)} KB
                </p>
              </div>
              {isExtracting && (
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              )}
              {extractedData && (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              )}
            </div>

            {isExtracting && (
              <div className="text-center py-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  AI is analyzing your document...
                </p>
              </div>
            )}

            {extractedData && (
              <div className="space-y-3">
                <h4 className="font-semibold">Extracted Information</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {extractedData.title && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Title:</span>
                      <p className="font-medium">{extractedData.title}</p>
                      <span className="text-xs text-muted-foreground">
                        Confidence: {Math.round((extractedData.confidence.title || 0) * 100)}%
                      </span>
                    </div>
                  )}
                  {extractedData.carrier && (
                    <div>
                      <span className="text-muted-foreground">Carrier:</span>
                      <p className="font-medium">{extractedData.carrier}</p>
                    </div>
                  )}
                  {extractedData.caseType && (
                    <div>
                      <span className="text-muted-foreground">Case Type:</span>
                      <p className="font-medium">{extractedData.caseType}</p>
                    </div>
                  )}
                  {extractedData.trackingNumber && (
                    <div>
                      <span className="text-muted-foreground">Tracking:</span>
                      <p className="font-medium font-mono text-xs">
                        {extractedData.trackingNumber}
                      </p>
                    </div>
                  )}
                  {extractedData.claimAmount && (
                    <div>
                      <span className="text-muted-foreground">Amount:</span>
                      <p className="font-medium">${extractedData.claimAmount}</p>
                    </div>
                  )}
                  {extractedData.description && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Description:</span>
                      <p className="text-sm">{extractedData.description}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button onClick={handleUseExtractedData} className="flex-1">
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Use This Data
                  </Button>
                  <Button onClick={handleReset} variant="outline">
                    <XCircle className="mr-2 h-4 w-4" />
                    Try Another
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
