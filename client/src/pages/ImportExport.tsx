import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Upload, Download, FileText, FileSpreadsheet, CheckCircle2,
  AlertCircle, Loader2, FileDown, QrCode, Barcode, Printer
} from "lucide-react";
import { toast } from "sonner";

export default function ImportExport() {
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationResults, setValidationResults] = useState<any>(null);
  const [selectedDataType, setSelectedDataType] = useState("purchase-orders");
  const [exportFormat, setExportFormat] = useState("csv");

  const dataTypes = [
    { value: "purchase-orders", label: "Purchase Orders" },
    { value: "inventory", label: "Inventory Items" },
    { value: "cases", label: "Cases" },
    { value: "vendors", label: "Vendors" },
    { value: "customers", label: "Customers" },
  ];

  const exportFormats = [
    { value: "csv", label: "CSV", icon: FileText },
    { value: "excel", label: "Excel (.xlsx)", icon: FileSpreadsheet },
    { value: "pdf", label: "PDF", icon: FileDown },
    { value: "json", label: "JSON", icon: FileText },
  ];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = [
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];

    if (!validTypes.includes(file.type) && !file.name.endsWith(".csv")) {
      toast.error("Please upload a valid CSV or Excel file");
      return;
    }

    setImportFile(file);
    toast.success(`File selected: ${file.name}`);
  };

  const validateImport = async () => {
    if (!importFile) return;

    setIsProcessing(true);
    
    // Simulate validation
    await new Promise(resolve => setTimeout(resolve, 1500));

    const mockValidation = {
      totalRows: 156,
      validRows: 152,
      invalidRows: 4,
      warnings: 8,
      errors: [
        { row: 12, field: "amount", message: "Invalid amount format" },
        { row: 45, field: "vendor", message: "Vendor not found in system" },
        { row: 78, field: "date", message: "Date format incorrect" },
        { row: 134, field: "amount", message: "Amount exceeds maximum limit" },
      ],
    };

    setValidationResults(mockValidation);
    setIsProcessing(false);
    toast.success("Validation complete!");
  };

  const executeImport = async () => {
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    toast.success(`Successfully imported ${validationResults.validRows} records!`);
    setImportFile(null);
    setValidationResults(null);
    setIsProcessing(false);
  };

  const handleExport = async () => {
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const dataTypeLabel = dataTypes.find(dt => dt.value === selectedDataType)?.label;
    const formatLabel = exportFormats.find(ef => ef.value === exportFormat)?.label;
    
    toast.success(`Exported ${dataTypeLabel} as ${formatLabel}`);
    setIsProcessing(false);
  };

  const generateLabels = async (type: "qr" | "barcode") => {
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success(`Generated ${type === "qr" ? "QR codes" : "barcodes"} for selected items`);
    setIsProcessing(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Import / Export</h1>
        <p className="text-muted-foreground mt-2">
          Bulk import data from CSV/Excel or export to multiple formats
        </p>
      </div>

      <Tabs defaultValue="import" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="import">Import</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
          <TabsTrigger value="labels">Labels</TabsTrigger>
        </TabsList>

        {/* Import Tab */}
        <TabsContent value="import" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Upload Section */}
            <Card>
              <CardHeader>
                <CardTitle>Upload File</CardTitle>
                <CardDescription>
                  Import data from CSV or Excel files
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Data Type Selector */}
                <div className="space-y-2">
                  <Label>Data Type</Label>
                  <Select value={selectedDataType} onValueChange={setSelectedDataType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {dataTypes.map(dt => (
                        <SelectItem key={dt.value} value={dt.value}>
                          {dt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* File Upload */}
                <div
                  onClick={() => document.getElementById("import-file")?.click()}
                  className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
                >
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-sm font-medium mb-1">
                    {importFile ? importFile.name : "Click to upload or drag and drop"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    CSV or Excel (.xlsx) files
                  </p>
                  <input
                    id="import-file"
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>

                {/* Template Download */}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Download className="mr-2 h-4 w-4" />
                    Download Template
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <FileText className="mr-2 h-4 w-4" />
                    View Guide
                  </Button>
                </div>

                {/* Validate Button */}
                <Button
                  onClick={validateImport}
                  disabled={!importFile || isProcessing}
                  className="w-full"
                  size="lg"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Validating...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Validate Data
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Validation Results */}
            <Card>
              <CardHeader>
                <CardTitle>Validation Results</CardTitle>
                <CardDescription>
                  Review data before importing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!validationResults && !isProcessing && (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p>Upload and validate a file to see results</p>
                  </div>
                )}

                {isProcessing && (
                  <div className="text-center py-12">
                    <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary mb-4" />
                    <p className="text-muted-foreground">Validating your data...</p>
                  </div>
                )}

                {validationResults && (
                  <div className="space-y-4">
                    {/* Summary Stats */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg bg-muted">
                        <p className="text-sm text-muted-foreground">Total Rows</p>
                        <p className="text-2xl font-bold">{validationResults.totalRows}</p>
                      </div>
                      <div className="p-4 rounded-lg bg-green-500/10">
                        <p className="text-sm text-green-600 dark:text-green-500">Valid Rows</p>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-500">
                          {validationResults.validRows}
                        </p>
                      </div>
                      <div className="p-4 rounded-lg bg-red-500/10">
                        <p className="text-sm text-red-600 dark:text-red-500">Errors</p>
                        <p className="text-2xl font-bold text-red-600 dark:text-red-500">
                          {validationResults.invalidRows}
                        </p>
                      </div>
                      <div className="p-4 rounded-lg bg-yellow-500/10">
                        <p className="text-sm text-yellow-600 dark:text-yellow-500">Warnings</p>
                        <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-500">
                          {validationResults.warnings.length}
                        </p>
                      </div>
                    </div>

                    {/* Errors List */}
                    {validationResults.errors.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-red-600 dark:text-red-500 flex items-center gap-2">
                          <AlertCircle size={16} />
                          Errors Found
                        </Label>
                        <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                          {validationResults.errors.map((error: any, index: number) => (
                            <div key={index} className="p-3 text-sm">
                              <p className="font-medium">Row {error.row}: {error.field}</p>
                              <p className="text-muted-foreground text-xs">{error.message}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Import Button */}
                    <Button
                      onClick={executeImport}
                      disabled={validationResults.invalidRows > 0 || isProcessing}
                      className="w-full"
                      size="lg"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Importing...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Import {validationResults.validRows} Records
                        </>
                      )}
                    </Button>

                    {validationResults.invalidRows > 0 && (
                      <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 text-red-600 dark:text-red-500">
                        <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                        <p className="text-sm">
                          Fix errors before importing. Download error report or edit your file.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Export Tab */}
        <TabsContent value="export" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Export Data</CardTitle>
              <CardDescription>
                Export your data in multiple formats
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Data Type */}
                <div className="space-y-2">
                  <Label>Data Type</Label>
                  <Select value={selectedDataType} onValueChange={setSelectedDataType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {dataTypes.map(dt => (
                        <SelectItem key={dt.value} value={dt.value}>
                          {dt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Export Format */}
                <div className="space-y-2">
                  <Label>Export Format</Label>
                  <Select value={exportFormat} onValueChange={setExportFormat}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {exportFormats.map(ef => (
                        <SelectItem key={ef.value} value={ef.value}>
                          {ef.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Export Button */}
              <Button
                onClick={handleExport}
                disabled={isProcessing}
                className="w-full"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Export Data
                  </>
                )}
              </Button>

              {/* Quick Export Buttons */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t">
                {exportFormats.map(format => (
                  <Button
                    key={format.value}
                    variant="outline"
                    onClick={() => {
                      setExportFormat(format.value);
                      handleExport();
                    }}
                    disabled={isProcessing}
                  >
                    <format.icon className="mr-2 h-4 w-4" />
                    {format.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Labels Tab */}
        <TabsContent value="labels" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* QR Codes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="text-primary" />
                  QR Code Labels
                </CardTitle>
                <CardDescription>
                  Generate QR codes for inventory items
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                  <QrCode size={120} className="text-muted-foreground" />
                </div>
                <Button
                  onClick={() => generateLabels("qr")}
                  disabled={isProcessing}
                  className="w-full"
                >
                  <QrCode className="mr-2 h-4 w-4" />
                  Generate QR Codes
                </Button>
                <Button variant="outline" className="w-full">
                  <Printer className="mr-2 h-4 w-4" />
                  Print Labels
                </Button>
              </CardContent>
            </Card>

            {/* Barcodes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Barcode className="text-primary" />
                  Barcode Labels
                </CardTitle>
                <CardDescription>
                  Generate barcodes for inventory items
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                  <Barcode size={120} className="text-muted-foreground" />
                </div>
                <Button
                  onClick={() => generateLabels("barcode")}
                  disabled={isProcessing}
                  className="w-full"
                >
                  <Barcode className="mr-2 h-4 w-4" />
                  Generate Barcodes
                </Button>
                <Button variant="outline" className="w-full">
                  <Printer className="mr-2 h-4 w-4" />
                  Print Labels
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
