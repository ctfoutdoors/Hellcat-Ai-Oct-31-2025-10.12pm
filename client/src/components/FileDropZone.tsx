import { useState, useCallback } from "react";
import { Upload, X, FileText, Image as ImageIcon, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FileWithPreview extends File {
  preview?: string;
}

interface FileDropZoneProps {
  onFilesSelected: (files: File[]) => void;
  maxFiles?: number;
  accept?: string;
  maxSize?: number; // in MB
  className?: string;
}

export function FileDropZone({
  onFilesSelected,
  maxFiles = 10,
  accept = "image/*,.pdf,.doc,.docx",
  maxSize = 10,
  className,
}: FileDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileWithPreview[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const validateFiles = (files: File[]): { valid: File[]; errors: string[] } => {
    const valid: File[] = [];
    const errors: string[] = [];

    for (const file of files) {
      // Check file size
      if (file.size > maxSize * 1024 * 1024) {
        errors.push(`${file.name} exceeds ${maxSize}MB limit`);
        continue;
      }

      // Check file count
      if (selectedFiles.length + valid.length >= maxFiles) {
        errors.push(`Maximum ${maxFiles} files allowed`);
        break;
      }

      valid.push(file);
    }

    return { valid, errors };
  };

  const processFiles = (files: File[]) => {
    const { valid, errors } = validateFiles(files);

    if (errors.length > 0) {
      setError(errors.join(", "));
      setTimeout(() => setError(null), 5000);
    }

    if (valid.length > 0) {
      const filesWithPreview = valid.map((file) => {
        const fileWithPreview = file as FileWithPreview;
        if (file.type.startsWith("image/")) {
          fileWithPreview.preview = URL.createObjectURL(file);
        }
        return fileWithPreview;
      });

      setSelectedFiles((prev) => [...prev, ...filesWithPreview]);
      onFilesSelected([...selectedFiles, ...valid]);
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      processFiles(files);
    },
    [selectedFiles, maxFiles, maxSize]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      processFiles(files);
    }
  };

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    onFilesSelected(newFiles);

    // Revoke preview URL to avoid memory leaks
    if (selectedFiles[index].preview) {
      URL.revokeObjectURL(selectedFiles[index].preview!);
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) return <ImageIcon className="h-8 w-8" />;
    if (file.type === "application/pdf") return <FileText className="h-8 w-8" />;
    return <File className="h-8 w-8" />;
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Drop Zone */}
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative border-2 border-dashed rounded-lg p-8 transition-colors",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50"
        )}
      >
        <input
          type="file"
          id="file-upload"
          multiple
          accept={accept}
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <div className={cn(
            "p-4 rounded-full transition-colors",
            isDragging ? "bg-primary/10" : "bg-muted"
          )}>
            <Upload className={cn(
              "h-8 w-8 transition-colors",
              isDragging ? "text-primary" : "text-muted-foreground"
            )} />
          </div>
          
          <div>
            <p className="text-lg font-medium">
              {isDragging ? "Drop files here" : "Drag & drop files here"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              or click to browse (max {maxSize}MB per file)
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Accepts: Images, PDFs, Word documents
            </p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">
            Selected Files ({selectedFiles.length}/{maxFiles})
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border"
              >
                {file.preview ? (
                  <img
                    src={file.preview}
                    alt={file.name}
                    className="h-12 w-12 object-cover rounded"
                  />
                ) : (
                  <div className="h-12 w-12 flex items-center justify-center bg-muted rounded">
                    {getFileIcon(file)}
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
