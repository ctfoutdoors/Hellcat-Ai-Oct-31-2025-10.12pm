import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Upload, FileText, Loader2, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useDropzone } from "react-dropzone";

export default function PDFInvoiceScanner() {
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const processAndCreateMutation = trpc.pdfInvoiceScanner.processAndCreateCases.useMutation();
  const batchProcessMutation = trpc.pdfInvoiceScanner.batchProcess.useMutation();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(prev => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    multiple: true,
  });

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const processFiles = async () => {
    if (files.length === 0) {
      toast.error("No files selected", {
        description: "Please upload at least one PDF invoice",
      });
      return;
    }

    setProcessing(true);
    setResults([]);

    try {
      if (files.length === 1) {
        // Process single file
        const file = files[0];
        const reader = new FileReader();
        
        reader.onload = async (e) => {
          const base64 = e.target?.result?.toString().split(',')[1];
          if (!base64) throw new Error("Failed to read file");

          const result = await processAndCreateMutation.mutateAsync({
            pdfBase64: base64,
          });

          setResults([{
            fileName: file.name,
            success: true,
            casesCreated: result.casesCreated,
            invoiceData: result.invoiceData,
          }]);

          toast.success("Invoice processed", {
            description: `Created ${result.casesCreated} draft cases`,
          });
        };

        reader.readAsDataURL(file);
      } else {
        // Batch process multiple files
        const pdfsBase64: string[] = [];
        
        for (const file of files) {
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              const result = e.target?.result?.toString().split(',')[1];
              if (result) resolve(result);
              else reject(new Error("Failed to read file"));
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          
          pdfsBase64.push(base64);
        }

        const result = await batchProcessMutation.mutateAsync({
          pdfsBase64,
        });

        setResults(files.map((file, index) => ({
          fileName: file.name,
          success: true,
          casesCreated: Math.floor(result.casesCreated / files.length), // Approximate
        })));

        toast.success("Batch processing complete", {
          description: `Processed ${result.processed} invoices, created ${result.casesCreated} cases`,
        });
      }

      setFiles([]);
    } catch (error: any) {
      toast.error("Processing failed", {
        description: error.message || "Failed to process PDF invoices",
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">PDF Invoice Scanner</h1>
        <p className="text-gray-600 mt-2">
          Upload carrier invoices to automatically extract charges and create dispute cases
        </p>
      </div>

      {/* Upload Area */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Upload Invoices</CardTitle>
          <CardDescription>
            Drag and drop PDF invoices or click to browse. Supports FedEx, UPS, and USPS formats.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
              isDragActive
                ? "border-primary bg-primary/5"
                : "border-gray-300 hover:border-primary hover:bg-gray-50"
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            {isDragActive ? (
              <p className="text-lg text-primary font-medium">Drop PDF files here...</p>
            ) : (
              <>
                <p className="text-lg font-medium text-gray-900 mb-2">
                  Drag & drop PDF invoices here
                </p>
                <p className="text-sm text-gray-500">or click to browse files</p>
              </>
            )}
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="mt-6 space-y-2">
              <h3 className="font-medium text-gray-900 mb-3">
                Selected Files ({files.length})
              </h3>
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-red-500" />
                    <div>
                      <p className="font-medium text-gray-900">{file.name}</p>
                      <p className="text-sm text-gray-500">
                        {(file.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    disabled={processing}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Process Button */}
          {files.length > 0 && (
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setFiles([])}
                disabled={processing}
              >
                Clear All
              </Button>
              <Button onClick={processFiles} disabled={processing} size="lg">
                {processing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Process {files.length} {files.length === 1 ? "Invoice" : "Invoices"}
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Processing Results</CardTitle>
            <CardDescription>Summary of processed invoices and created cases</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.map((result, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    {result.success ? (
                      <CheckCircle2 className="h-6 w-6 text-green-500" />
                    ) : (
                      <AlertCircle className="h-6 w-6 text-red-500" />
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{result.fileName}</p>
                      {result.invoiceData && (
                        <p className="text-sm text-gray-500 mt-1">
                          Carrier: {result.invoiceData.carrier} • 
                          Tracking Numbers: {result.invoiceData.trackingNumbers.length} • 
                          Charges: {result.invoiceData.charges.length}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-green-500">
                      {result.casesCreated} cases created
                    </Badge>
                    {result.invoiceData?.totalAmount && (
                      <p className="text-sm text-gray-500 mt-1">
                        Total: ${result.invoiceData.totalAmount.toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 mb-3">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-medium text-gray-900 mb-2">1. Upload Invoices</h3>
              <p className="text-sm text-gray-600">
                Upload PDF invoices from FedEx, UPS, or USPS. Supports batch processing.
              </p>
            </div>
            <div>
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 mb-3">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-medium text-gray-900 mb-2">2. OCR Extraction</h3>
              <p className="text-sm text-gray-600">
                Automatically extracts tracking numbers, charges, and dimensional weight adjustments.
              </p>
            </div>
            <div>
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 mb-3">
                <CheckCircle2 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-medium text-gray-900 mb-2">3. Auto-Create Cases</h3>
              <p className="text-sm text-gray-600">
                Draft cases are automatically created for suspicious charges, ready for review.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
