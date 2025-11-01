import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileSpreadsheet, CheckCircle2, XCircle, AlertCircle, Download } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ImportRow {
  row: number;
  data: any;
  status: "pending" | "success" | "error";
  error?: string;
  caseId?: number;
}

export default function ImportCases() {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState<ImportRow[]>([]);
  const [importResults, setImportResults] = useState<ImportRow[]>([]);
  const [progress, setProgress] = useState(0);

  const parseFileMutation = trpc.import.parseFile.useMutation({
    onSuccess: (data) => {
      setPreview(data.rows.map((row: any, index: number) => ({
        row: index + 1,
        data: row,
        status: "pending" as const,
      })));
      toast.success(`Parsed ${data.rows.length} rows from file`);
    },
    onError: (error) => {
      toast.error(`Failed to parse file: ${error.message}`);
    },
  });

  const importCasesMutation = trpc.import.importCases.useMutation({
    onSuccess: (data) => {
      setImportResults(data.results);
      setProgress(100);
      setImporting(false);
      toast.success(`Import complete: ${data.success} succeeded, ${data.failed} failed`);
    },
    onError: (error) => {
      toast.error(`Import failed: ${error.message}`);
      setImporting(false);
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview([]);
      setImportResults([]);
      setProgress(0);
    }
  };

  const handleParseFile = async () => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      parseFileMutation.mutate({
        content,
        fileName: file.name,
      });
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    if (preview.length === 0) return;

    setImporting(true);
    setProgress(0);

    importCasesMutation.mutate({
      rows: preview.map(p => p.data),
    });
  };

  const downloadTemplate = () => {
    const template = `tracking_id,carrier,service_type,original_amount,adjusted_amount,claimed_amount,actual_dimensions,carrier_dimensions,customer_name,customer_email,customer_phone,order_id,notes
1Z999AA10123456784,FEDEX,Ground,50.00,75.00,25.00,10x10x10,12x12x12,John Doe,john@example.com,555-1234,ORD-001,Dimensional weight dispute
1Z999AA10123456785,UPS,Express,100.00,150.00,50.00,8x8x8,10x10x10,Jane Smith,jane@example.com,555-5678,ORD-002,Overcharge dispute`;

    const blob = new Blob([template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "case_import_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Mass Import Cases</h1>
        <p className="text-muted-foreground mt-2">
          Upload a CSV or Excel file to create multiple cases at once
        </p>
      </div>

      <div className="grid gap-6">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle>Upload File</CardTitle>
            <CardDescription>
              Select a CSV or Excel file containing case data. Download the template to see the required format.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="file">Select File</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileSelect}
                  disabled={importing}
                />
              </div>
              <div className="flex items-end gap-2">
                <Button
                  onClick={handleParseFile}
                  disabled={!file || parseFileMutation.isPending || importing}
                >
                  {parseFileMutation.isPending ? (
                    <>Parsing...</>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Parse File
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={downloadTemplate}>
                  <Download className="mr-2 h-4 w-4" />
                  Template
                </Button>
              </div>
            </div>

            {file && (
              <Alert>
                <FileSpreadsheet className="h-4 w-4" />
                <AlertDescription>
                  Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Preview Section */}
        {preview.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Preview</CardTitle>
                  <CardDescription>
                    Review the parsed data before importing ({preview.length} rows)
                  </CardDescription>
                </div>
                <Button
                  onClick={handleImport}
                  disabled={importing || importCasesMutation.isPending}
                >
                  {importing ? "Importing..." : "Import All Cases"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {importing && (
                <div className="mb-4">
                  <Progress value={progress} className="h-2" />
                  <p className="text-sm text-muted-foreground mt-2">
                    Importing cases... {progress}%
                  </p>
                </div>
              )}

              <div className="border rounded-lg overflow-auto max-h-96">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Row</TableHead>
                      <TableHead>Tracking ID</TableHead>
                      <TableHead>Carrier</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Claimed</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead className="w-12">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.map((row) => (
                      <TableRow key={row.row}>
                        <TableCell>{row.row}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {row.data.tracking_id || "-"}
                        </TableCell>
                        <TableCell>{row.data.carrier || "-"}</TableCell>
                        <TableCell>{row.data.service_type || "-"}</TableCell>
                        <TableCell>${row.data.claimed_amount || "0.00"}</TableCell>
                        <TableCell>{row.data.customer_name || "-"}</TableCell>
                        <TableCell>
                          {row.status === "pending" && (
                            <AlertCircle className="h-4 w-4 text-muted-foreground" />
                          )}
                          {row.status === "success" && (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          )}
                          {row.status === "error" && (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results Section */}
        {importResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Import Results</CardTitle>
              <CardDescription>
                {importResults.filter(r => r.status === "success").length} succeeded,{" "}
                {importResults.filter(r => r.status === "error").length} failed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-auto max-h-96">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Row</TableHead>
                      <TableHead>Tracking ID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Case ID</TableHead>
                      <TableHead>Error</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importResults.map((result) => (
                      <TableRow key={result.row}>
                        <TableCell>{result.row}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {result.data.tracking_id || "-"}
                        </TableCell>
                        <TableCell>
                          {result.status === "success" ? (
                            <span className="flex items-center text-green-600">
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              Success
                            </span>
                          ) : (
                            <span className="flex items-center text-red-600">
                              <XCircle className="mr-2 h-4 w-4" />
                              Failed
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {result.caseId ? `#${result.caseId}` : "-"}
                        </TableCell>
                        <TableCell className="text-red-600 text-sm">
                          {result.error || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
