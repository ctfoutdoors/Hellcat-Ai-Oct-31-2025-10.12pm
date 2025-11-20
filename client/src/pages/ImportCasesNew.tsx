import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileDropZone } from "@/components/FileDropZone";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Download, Upload, Database, Loader2, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";

export default function ImportCasesNew() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("shipstation");
  
  // ShipStation import state
  const [daysBack, setDaysBack] = useState(30);
  const [exceptionTypes, setExceptionTypes] = useState<string[]>([]);
  const [showShipStationResults, setShowShipStationResults] = useState(false);
  const [shipstationResults, setShipstationResults] = useState<any>(null);
  
  // File upload state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedData, setParsedData] = useState<any>(null);
  const [parseConfidence, setParseConfidence] = useState<number>(0);
  const [newCaseData, setNewCaseData] = useState({
    title: "",
    description: "",
    caseType: "late_delivery",
    carrier: "",
    trackingNumber: "",
    claimAmount: "",
    priority: "medium" as "low" | "medium" | "high" | "urgent",
    customerName: "",
    customerEmail: "",
    customerPhone: "",
  });
  const [showFileUploadDialog, setShowFileUploadDialog] = useState(false);
  
  // CSV import state
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [showCsvResults, setShowCsvResults] = useState(false);
  const [csvResults, setCsvResults] = useState<any>(null);

  // Mutations
  const importFromShipStation = trpc.cases.importFromShipStation.useMutation();
  const createCase = trpc.cases.create.useMutation();
  const uploadFiles = trpc.cases.uploadFiles.useMutation();
  const importFromCSV = trpc.cases.importFromCSV.useMutation();
  const parseDocument = trpc.cases.parseDocument.useMutation();

  const handleShipStationImport = async () => {
    try {
      const result = await importFromShipStation.mutateAsync({
        daysBack,
        exceptionTypes: exceptionTypes.length > 0 ? exceptionTypes as any : undefined,
      });
      
      setShipstationResults(result);
      setShowShipStationResults(true);
      
      if (result.imported > 0) {
        toast.success(`Successfully imported ${result.imported} cases from ShipStation`);
      } else {
        toast.info("No new cases to import");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to import from ShipStation");
    }
  };

  const handleFileUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error("Please select at least one file");
      return;
    }

    if (!newCaseData.title || !newCaseData.caseType) {
      toast.error("Please fill in required fields (Title and Case Type)");
      return;
    }

    try {
      // Create the case first
      const newCase = await createCase.mutateAsync(newCaseData);
      
      // Convert files to base64 and upload
      const filePromises = selectedFiles.map(file => {
        return new Promise<{ fileName: string; fileType: string; fileData: string; fileSize: number }>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const base64 = (reader.result as string).split(',')[1]; // Remove data:image/png;base64, prefix
            resolve({
              fileName: file.name,
              fileType: file.type,
              fileData: base64,
              fileSize: file.size,
            });
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      });

      const filesData = await Promise.all(filePromises);
      
      await uploadFiles.mutateAsync({
        caseId: newCase.id,
        files: filesData,
      });

      toast.success(`Case created with ${selectedFiles.length} file(s) attached`);
      setShowFileUploadDialog(false);
      setSelectedFiles([]);
      setNewCaseData({
        title: "",
        description: "",
        caseType: "late_delivery",
        carrier: "",
        trackingNumber: "",
        claimAmount: "",
        priority: "medium",
        customerName: "",
        customerEmail: "",
        customerPhone: "",
      });
      
      // Navigate to the new case
      navigate(`/cases/${newCase.id}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to create case with files");
    }
  };

  const handleCsvImport = async () => {
    if (!csvFile) {
      toast.error("Please select a CSV file");
      return;
    }

    try {
      const csvContent = await csvFile.text();
      const result = await importFromCSV.mutateAsync({ csvData: csvContent });
      
      setCsvResults(result);
      setShowCsvResults(true);
      
      if (result.imported > 0) {
        toast.success(`Successfully imported ${result.imported} cases from CSV`);
      } else {
        toast.info("No new cases to import");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to import from CSV");
    }
  };

  const downloadCsvTemplate = () => {
    const template = `title,description,caseType,carrier,trackingNumber,claimAmount,priority,customerName,customerEmail,customerPhone
Late Delivery - Order #12345,Package not delivered on time,late_delivery,UPS,1Z999AA10123456784,150.00,high,John Doe,john@example.com,555-0123
Missing Package - Order #12346,Package never arrived,no_tracking,USPS,9400111899562537289123,85.50,urgent,Jane Smith,jane@example.com,555-0124`;
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cases_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV template downloaded");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Import Cases</h1>
        <p className="text-muted-foreground mt-2">
          Import carrier dispute cases from multiple sources
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="shipstation">
            <Database className="h-4 w-4 mr-2" />
            ShipStation
          </TabsTrigger>
          <TabsTrigger value="files">
            <Upload className="h-4 w-4 mr-2" />
            Screenshots/Files
          </TabsTrigger>
          <TabsTrigger value="csv">
            <Download className="h-4 w-4 mr-2" />
            CSV Bulk Import
          </TabsTrigger>
        </TabsList>

        {/* ShipStation Import */}
        <TabsContent value="shipstation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Import from ShipStation</CardTitle>
              <CardDescription>
                Automatically detect delivery exceptions and create cases
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Days to Look Back</Label>
                <Input
                  type="number"
                  value={daysBack}
                  onChange={(e) => setDaysBack(parseInt(e.target.value) || 30)}
                  min={1}
                  max={90}
                />
                <p className="text-sm text-muted-foreground">
                  Scan orders from the last {daysBack} days for exceptions
                </p>
              </div>

              <div className="space-y-2">
                <Label>Exception Types (optional)</Label>
                <div className="flex flex-wrap gap-2">
                  {['late_delivery', 'no_tracking', 'missing_delivery_date'].map((type) => (
                    <Button
                      key={type}
                      variant={exceptionTypes.includes(type) ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        if (exceptionTypes.includes(type)) {
                          setExceptionTypes(exceptionTypes.filter(t => t !== type));
                        } else {
                          setExceptionTypes([...exceptionTypes, type]);
                        }
                      }}
                    >
                      {type.replace(/_/g, ' ')}
                    </Button>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  Leave empty to import all exception types
                </p>
              </div>

              <Button
                onClick={handleShipStationImport}
                disabled={importFromShipStation.isPending}
                className="w-full"
              >
                {importFromShipStation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Import from ShipStation
              </Button>

              {showShipStationResults && shipstationResults && (
                <div className="mt-4 p-4 bg-muted rounded-lg space-y-2">
                  <h3 className="font-semibold">Import Results</h3>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span>{shipstationResults.imported} Imported</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                      <span>{shipstationResults.skipped} Skipped</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span>{shipstationResults.errors} Errors</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* File Upload */}
        <TabsContent value="files" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upload Screenshots & Documents</CardTitle>
              <CardDescription>
                Create a case and attach supporting files (screenshots, PDFs, etc.)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FileDropZone
                onFilesSelected={async (files) => {
                  setSelectedFiles(files);
                  
                  // Automatically parse the first file with AI
                  if (files.length > 0) {
                    setIsParsing(true);
                    toast.info("Analyzing document with AI...");
                    
                    try {
                      const file = files[0];
                      const reader = new FileReader();
                      
                      reader.onload = async () => {
                        const base64 = (reader.result as string).split(',')[1];
                        
                        try {
                          const result = await parseDocument.mutateAsync({
                            fileData: base64,
                            fileName: file.name,
                            fileType: file.type,
                          });

                          if (result.success && result.data) {
                            const parsed = result.data;
                            setParsedData(parsed);
                            setParseConfidence(parsed.confidence || 0);
                            
                            // Auto-fill form fields
                            setNewCaseData((prev) => ({
                              ...prev,
                              title: parsed.title || prev.title,
                              description: parsed.description || prev.description,
                              caseType: parsed.caseType || prev.caseType,
                              carrier: parsed.carrier || prev.carrier,
                              trackingNumber: parsed.trackingNumber || prev.trackingNumber,
                              claimAmount: parsed.claimAmount?.toString() || prev.claimAmount,
                              priority: parsed.priority || prev.priority,
                              customerName: parsed.customerName || prev.customerName,
                              customerEmail: parsed.customerEmail || prev.customerEmail,
                              customerPhone: parsed.customerPhone || prev.customerPhone,
                            }));

                            toast.success(`Document parsed (${parsed.confidence}% confidence)`);
                          } else {
                            toast.warning(result.message || "Could not parse document automatically");
                          }
                        } catch (error: any) {
                          console.error("Parsing error:", error);
                          toast.error("Failed to parse document. Please fill in details manually.");
                        } finally {
                          setIsParsing(false);
                        }
                      };
                      
                      reader.readAsDataURL(file);
                    } catch (error) {
                      setIsParsing(false);
                      toast.error("Failed to read file");
                    }
                  }
                }}
                maxFiles={10}
                accept="image/*,.pdf,.doc,.docx"
                maxSize={10}
              />

              {isParsing && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  <span className="text-sm text-blue-700 dark:text-blue-300">Analyzing document with AI...</span>
                </div>
              )}

              {parsedData && parseConfidence > 0 && (
                <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-green-700 dark:text-green-300">✓ Document Parsed Successfully</span>
                    <span className="text-xs text-green-600 dark:text-green-400">{parseConfidence}% confidence</span>
                  </div>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    Form fields have been auto-filled. Please review and edit as needed.
                  </p>
                </div>
              )}

              <Button
                onClick={() => setShowFileUploadDialog(true)}
                disabled={selectedFiles.length === 0}
                className="w-full"
              >
                Continue with {selectedFiles.length} file(s)
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CSV Import */}
        <TabsContent value="csv" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>CSV Bulk Import</CardTitle>
              <CardDescription>
                Import multiple cases at once from a CSV file
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>CSV File</Label>
                <Input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                />
                <p className="text-sm text-muted-foreground">
                  Required columns: title, caseType
                </p>
              </div>

              <Button
                variant="outline"
                onClick={downloadCsvTemplate}
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                Download CSV Template
              </Button>

              <Button
                onClick={handleCsvImport}
                disabled={!csvFile || importFromCSV.isPending}
                className="w-full"
              >
                {importFromCSV.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Import from CSV
              </Button>

              {showCsvResults && csvResults && (
                <div className="mt-4 p-4 bg-muted rounded-lg space-y-2">
                  <h3 className="font-semibold">Import Results</h3>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span>{csvResults.imported} Imported</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                      <span>{csvResults.skipped} Skipped</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span>{csvResults.errors} Errors</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Case Creation Dialog for File Upload */}
      <Dialog open={showFileUploadDialog} onOpenChange={setShowFileUploadDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Case with Files</DialogTitle>
            <DialogDescription>
              Fill in case details to attach the {selectedFiles.length} selected file(s)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={newCaseData.title}
                onChange={(e) => setNewCaseData({ ...newCaseData, title: e.target.value })}
                placeholder="Brief description of the issue"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={newCaseData.description}
                onChange={(e) => setNewCaseData({ ...newCaseData, description: e.target.value })}
                placeholder="Detailed description of the case"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Case Type *</Label>
                <Select value={newCaseData.caseType} onValueChange={(value) => setNewCaseData({ ...newCaseData, caseType: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="late_delivery">Late Delivery</SelectItem>
                    <SelectItem value="no_tracking">No Tracking</SelectItem>
                    <SelectItem value="missing_delivery_date">Missing Delivery Date</SelectItem>
                    <SelectItem value="damaged">Damaged Package</SelectItem>
                    <SelectItem value="lost">Lost Package</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={newCaseData.priority} onValueChange={(value: any) => setNewCaseData({ ...newCaseData, priority: value })}>
                  <SelectTrigger>
                    <SelectValue />
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Carrier</Label>
                <Input
                  value={newCaseData.carrier}
                  onChange={(e) => setNewCaseData({ ...newCaseData, carrier: e.target.value })}
                  placeholder="UPS, USPS, FedEx, etc."
                />
              </div>

              <div className="space-y-2">
                <Label>Tracking Number</Label>
                <Input
                  value={newCaseData.trackingNumber}
                  onChange={(e) => setNewCaseData({ ...newCaseData, trackingNumber: e.target.value })}
                  placeholder="Tracking number"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Claim Amount</Label>
              <Input
                value={newCaseData.claimAmount}
                onChange={(e) => setNewCaseData({ ...newCaseData, claimAmount: e.target.value })}
                placeholder="0.00"
                type="number"
                step="0.01"
              />
            </div>

            <div className="space-y-2">
              <Label>Customer Name</Label>
              <Input
                value={newCaseData.customerName}
                onChange={(e) => setNewCaseData({ ...newCaseData, customerName: e.target.value })}
                placeholder="Customer name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Customer Email</Label>
                <Input
                  value={newCaseData.customerEmail}
                  onChange={(e) => setNewCaseData({ ...newCaseData, customerEmail: e.target.value })}
                  placeholder="customer@example.com"
                  type="email"
                />
              </div>

              <div className="space-y-2">
                <Label>Customer Phone</Label>
                <Input
                  value={newCaseData.customerPhone}
                  onChange={(e) => setNewCaseData({ ...newCaseData, customerPhone: e.target.value })}
                  placeholder="555-0123"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFileUploadDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleFileUpload} disabled={createCase.isPending || uploadFiles.isPending}>
              {(createCase.isPending || uploadFiles.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Case with Files
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
