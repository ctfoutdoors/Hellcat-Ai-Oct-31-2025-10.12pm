import { useState, useCallback, useRef } from "react";
import { Search, Upload, FileText, X, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useNavigate } from "wouter";
import { toast } from "sonner";

interface CaseSmartSearchProps {
  onCaseSelect?: (caseId: number) => void;
  onCreateNew?: (files: File[], searchQuery: string) => void;
}

/**
 * Smart Case Search Component
 * - Fuzzy search across all case fields
 * - Drag-and-drop file upload
 * - AI-powered case matching
 * - Quick case creation
 */
export default function CaseSmartSearch({ onCaseSelect, onCreateNew }: CaseSmartSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Search cases with fuzzy matching
  const { data: searchResults, isLoading } = trpc.cases.search.useQuery(
    { query: searchQuery },
    { enabled: searchQuery.length >= 2 }
  );

  // Handle file drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    setUploadedFiles((prev) => [...prev, ...files]);
  }, []);

  // Handle drag over
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  // Handle drag leave
  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Handle file input change
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setUploadedFiles((prev) => [...prev, ...files]);
    }
  };

  // Remove uploaded file
  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle case selection
  const handleCaseClick = (caseId: number) => {
    if (onCaseSelect) {
      onCaseSelect(caseId);
    } else {
      navigate(`/cases/${caseId}`);
    }
  };

  // Handle create new case
  const handleCreateNew = () => {
    if (onCreateNew) {
      onCreateNew(uploadedFiles, searchQuery);
    } else {
      // Navigate to import cases page with files
      navigate("/cases/import");
      if (uploadedFiles.length > 0) {
        toast.info(`${uploadedFiles.length} file(s) ready for upload`);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search by tracking number, customer name, order number, carrier..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-4 h-12 text-base"
        />
      </div>

      {/* Drag and Drop Zone */}
      <Card
        className={`border-2 border-dashed transition-colors ${
          isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <CardContent className="p-8">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <div className={`p-4 rounded-full ${isDragging ? "bg-primary/20" : "bg-muted"}`}>
              <Upload className={`h-8 w-8 ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
            </div>
            <div>
              <p className="text-lg font-medium">
                {isDragging ? "Drop files here" : "Drag and drop files here"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                or{" "}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-primary hover:underline font-medium"
                >
                  browse files
                </button>
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Supports PDF, images, and documents
              </p>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            onChange={handleFileSelect}
            className="hidden"
          />
        </CardContent>
      </Card>

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Uploaded Files ({uploadedFiles.length})</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {uploadedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-3 bg-muted rounded-lg group hover:bg-muted/80 transition-colors"
              >
                <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-sm flex-1 truncate">{file.name}</span>
                <span className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB
                </span>
                <button
                  onClick={() => removeFile(index)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search Results */}
      {searchQuery.length >= 2 && (
        <Card>
          <CardContent className="p-4">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                Searching cases...
              </div>
            ) : searchResults && searchResults.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm font-medium mb-3">
                  Found {searchResults.length} matching case{searchResults.length !== 1 ? "s" : ""}
                </p>
                {searchResults.map((result: any) => (
                  <button
                    key={result.id}
                    onClick={() => handleCaseClick(result.id)}
                    className="w-full text-left p-3 rounded-lg hover:bg-muted transition-colors border border-transparent hover:border-border"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">Case #{result.id}</span>
                          <Badge variant="outline" className="text-xs">
                            {result.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          {result.trackingNumber && (
                            <p>Tracking: {result.trackingNumber}</p>
                          )}
                          {result.customerName && (
                            <p>Customer: {result.customerName}</p>
                          )}
                          {result.carrier && <p>Carrier: {result.carrier}</p>}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground whitespace-nowrap">
                        {result.matchedFields && (
                          <span className="text-primary">
                            Matched: {result.matchedFields.join(", ")}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No matching cases found</p>
                <Button onClick={handleCreateNew} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create New Case
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      {(uploadedFiles.length > 0 || searchQuery.length >= 2) && (
        <div className="flex gap-2">
          <Button onClick={handleCreateNew} className="gap-2 flex-1">
            <Plus className="h-4 w-4" />
            {uploadedFiles.length > 0
              ? `Create Case with ${uploadedFiles.length} File(s)`
              : "Create New Case"}
          </Button>
        </div>
      )}
    </div>
  );
}
