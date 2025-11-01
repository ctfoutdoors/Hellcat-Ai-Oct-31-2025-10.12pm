import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileSpreadsheet, Download } from "lucide-react";
import { toast } from "sonner";

export default function Import() {
  const handleFileUpload = () => {
    toast.info("Bulk import feature coming soon");
  };

  const handleDownloadTemplate = () => {
    toast.info("Template download coming soon");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Import Cases</h1>
          <p className="text-muted-foreground mt-2">
            Bulk import cases from CSV or Excel files
          </p>
        </div>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>How to Import Cases</CardTitle>
            <CardDescription>Follow these steps to import multiple cases at once</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Download the CSV template below</li>
              <li>Fill in your case data following the template format</li>
              <li>Upload the completed file using the upload area</li>
              <li>Review and confirm the import preview</li>
            </ol>
            <Button variant="outline" onClick={handleDownloadTemplate}>
              <Download className="h-4 w-4 mr-2" />
              Download CSV Template
            </Button>
          </CardContent>
        </Card>

        {/* Upload Area */}
        <Card>
          <CardHeader>
            <CardTitle>Upload File</CardTitle>
            <CardDescription>Drag and drop your CSV or Excel file here</CardDescription>
          </CardHeader>
          <CardContent>
            <div 
              className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-primary/50 transition-colors cursor-pointer"
              onClick={handleFileUpload}
            >
              <div className="flex flex-col items-center gap-4">
                <div className="bg-primary/10 p-4 rounded-full">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Click to upload or drag and drop</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    CSV or Excel files up to 10MB
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Supported Fields */}
        <Card>
          <CardHeader>
            <CardTitle>Supported Fields</CardTitle>
            <CardDescription>Fields that can be imported from your file</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="font-medium">Required Fields</p>
                <ul className="mt-2 space-y-1 text-muted-foreground">
                  <li>• Tracking ID</li>
                  <li>• Carrier</li>
                  <li>• Original Amount</li>
                  <li>• Adjusted Amount</li>
                  <li>• Claimed Amount</li>
                </ul>
              </div>
              <div>
                <p className="font-medium">Optional Fields</p>
                <ul className="mt-2 space-y-1 text-muted-foreground">
                  <li>• Customer Name</li>
                  <li>• Order ID</li>
                  <li>• Service Type</li>
                  <li>• Adjustment Date</li>
                  <li>• Priority</li>
                </ul>
              </div>
              <div>
                <p className="font-medium">Dimension Fields</p>
                <ul className="mt-2 space-y-1 text-muted-foreground">
                  <li>• Actual Dimensions</li>
                  <li>• Carrier Dimensions</li>
                  <li>• Product SKUs</li>
                  <li>• Notes</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Imports */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Imports</CardTitle>
            <CardDescription>History of your bulk imports</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No imports yet</p>
              <p className="text-sm mt-2">Your import history will appear here</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
