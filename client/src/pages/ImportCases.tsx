import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText, AlertCircle, CheckCircle2, Download } from "lucide-react";
import { toast } from "sonner";

export default function ImportCases() {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<{ success: number; failed: number; errors: string[] } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResults(null);
    }
  };

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);
    toast.success("Import feature coming soon");
    setImporting(false);
  };

  const downloadTemplate = () => {
    const template = "Case Title,Carrier,Tracking Number,Case Type,Priority,Claim Amount,Description\n";
    const blob = new Blob([template], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "case_import_template.csv";
    a.click();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Import Cases</h1>
        <p className="text-muted-foreground mt-2">Bulk import cases from CSV file</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Upload CSV File</CardTitle>
        </CardHeader>
        <CardContent>
          <input type="file" accept=".csv" onChange={handleFileChange} />
          <Button onClick={handleImport} disabled={!file || importing} className="mt-4">
            {importing ? "Importing..." : "Import Cases"}
          </Button>
          <Button variant="outline" onClick={downloadTemplate} className="mt-4 ml-2">
            <Download className="mr-2 h-4 w-4" />
            Download Template
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
