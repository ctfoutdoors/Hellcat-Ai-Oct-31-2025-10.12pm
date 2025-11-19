import { useState, useCallback } from "react";
import { Upload, File, X, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface FileUploadZoneProps {
  entityType: "customer" | "vendor" | "lead" | "contact";
  entityId: number;
  onUploadComplete?: () => void;
}

export function FileUploadZone({ entityType, entityId, onUploadComplete }: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([]);
  
  const uploadMutation = trpc.attachments.upload.useMutation({
    onSuccess: () => {
      toast.success("File uploaded successfully");
      onUploadComplete?.();
    },
    onError: (error) => {
      toast.error(`Upload failed: ${error.message}`);
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

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    await handleFiles(files);
  }, [entityType, entityId]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    await handleFiles(files);
  }, [entityType, entityId]);

  const handleFiles = async (files: File[]) => {
    for (const file of files) {
      // Validate file size (max 16MB)
      if (file.size > 16 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 16MB)`);
        continue;
      }

      setUploadingFiles(prev => [...prev, file.name]);

      try {
        // Convert file to base64
        const reader = new FileReader();
        const fileData = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        // Upload to server
        await uploadMutation.mutateAsync({
          entityType,
          entityId,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          fileData: fileData.split(',')[1], // Remove data:mime;base64, prefix
        });
      } catch (error) {
        console.error("Upload error:", error);
      } finally {
        setUploadingFiles(prev => prev.filter(name => name !== file.name));
      }
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-muted-foreground/50"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Upload Files</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Drag and drop files here, or click to browse
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            Supports PDF, images, documents (max 16MB)
          </p>
          
          <input
            type="file"
            id="file-upload"
            className="hidden"
            multiple
            onChange={handleFileSelect}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif"
          />
          <label htmlFor="file-upload">
            <Button asChild variant="outline">
              <span>Browse Files</span>
            </Button>
          </label>
        </div>

        {/* Uploading files list */}
        {uploadingFiles.length > 0 && (
          <div className="mt-4 space-y-2">
            <h4 className="text-sm font-medium">Uploading...</h4>
            {uploadingFiles.map((fileName) => (
              <div key={fileName} className="flex items-center gap-2 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="truncate">{fileName}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
