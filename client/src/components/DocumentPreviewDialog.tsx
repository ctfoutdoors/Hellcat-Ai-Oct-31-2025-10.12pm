import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, X, FileText } from 'lucide-react';
import { Streamdown } from 'streamdown';

interface DocumentPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  content: string;
  fileName: string;
  onDownload: () => void;
  isMarkdown?: boolean;
}

const DocumentPreviewDialog: React.FC<DocumentPreviewDialogProps> = ({
  open,
  onOpenChange,
  title,
  content,
  fileName,
  onDownload,
  isMarkdown = true,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>
            Preview your document before downloading: {fileName}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto border rounded-lg p-6 bg-white">
          {isMarkdown ? (
            <Streamdown>{content}</Streamdown>
          ) : (
            <pre className="whitespace-pre-wrap font-sans text-sm">
              {content}
            </pre>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={() => {
              onDownload();
              onOpenChange(false);
            }}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Download {fileName}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentPreviewDialog;
