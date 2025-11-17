import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface PDFUploaderProps {
  type: "bol" | "invoice" | "po";
  onDataExtracted?: (data: any) => void;
}

export function PDFUploader({ type, onDataExtracted }: PDFUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);

  const parseBOL = trpc.po.parseBOL.useMutation();
  const parseInvoice = trpc.po.parseInvoice.useMutation();
  const parsePO = trpc.po.parsePO.useMutation();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Please select a PDF file");
      return;
    }

    try {
      setUploading(true);

      // Upload to S3 (you'll need to implement this endpoint)
      const formData = new FormData();
      formData.append("file", file);

      // For now, we'll use a placeholder URL
      // In production, you'd upload to S3 and get the URL
      const pdfUrl = URL.createObjectURL(file);

      setUploading(false);
      setParsing(true);

      // Parse the PDF based on type
      let data;
      if (type === "bol") {
        data = await parseBOL.mutateAsync({ pdfUrl });
      } else if (type === "invoice") {
        data = await parseInvoice.mutateAsync({ pdfUrl });
      } else {
        data = await parsePO.mutateAsync({ pdfUrl });
      }

      setExtractedData(data);
      toast.success("Document parsed successfully!");

      if (onDataExtracted) {
        onDataExtracted(data);
      }
    } catch (error) {
      console.error("Error processing PDF:", error);
      toast.error("Failed to process PDF");
    } finally {
      setUploading(false);
      setParsing(false);
    }
  };

  const getTitle = () => {
    switch (type) {
      case "bol":
        return "Upload Bill of Lading";
      case "invoice":
        return "Upload Invoice";
      case "po":
        return "Upload Purchase Order";
    }
  };

  const getDescription = () => {
    switch (type) {
      case "bol":
        return "Upload a BOL PDF to automatically extract shipment information";
      case "invoice":
        return "Upload an invoice PDF to automatically extract billing information";
      case "po":
        return "Upload a PO PDF to automatically extract order details";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          {getTitle()}
        </CardTitle>
        <CardDescription>{getDescription()}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              disabled={uploading || parsing}
              onClick={() => document.getElementById(`pdf-upload-${type}`)?.click()}
            >
              {uploading || parsing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {uploading ? "Uploading..." : "Parsing..."}
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Select PDF
                </>
              )}
            </Button>
            <input
              id={`pdf-upload-${type}`}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>

          {extractedData && (
            <div className="rounded-lg bg-muted p-4">
              <h4 className="font-semibold mb-2">Extracted Data:</h4>
              <pre className="text-xs overflow-auto max-h-96">
                {JSON.stringify(extractedData, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
