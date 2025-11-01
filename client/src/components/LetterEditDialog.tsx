import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Save, Eye, Edit3, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface LetterEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  letterContent: string;
  caseNumber: string;
  onSave?: (editedContent: string) => void;
  onDownload?: (content: string, format: 'txt' | 'pdf' | 'docx') => void;
}

const LetterEditDialog: React.FC<LetterEditDialogProps> = ({
  open,
  onOpenChange,
  letterContent,
  caseNumber,
  onSave,
  onDownload,
}) => {
  const [editedContent, setEditedContent] = useState(letterContent);
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = () => {
    onSave?.(editedContent);
    toast.success('Letter saved successfully');
    setIsEditing(false);
  };

  const handleDownload = (format: 'txt' | 'pdf' | 'docx') => {
    onDownload?.(editedContent, format);
    toast.success(`Letter downloaded as ${format.toUpperCase()}`);
  };

  const handleReset = () => {
    setEditedContent(letterContent);
    toast.info('Letter reset to original content');
  };

  const wordCount = editedContent.split(/\s+/).filter(Boolean).length;
  const charCount = editedContent.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Edit Dispute Letter - {caseNumber}
          </DialogTitle>
          <DialogDescription>
            Review and edit the AI-generated dispute letter before downloading or sending.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="edit" className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="edit" className="gap-2">
              <Edit3 className="h-4 w-4" />
              Edit
            </TabsTrigger>
            <TabsTrigger value="preview" className="gap-2">
              <Eye className="h-4 w-4" />
              Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="edit" className="flex-1 flex flex-col min-h-0 space-y-4">
            <div className="flex-1 flex flex-col min-h-0">
              <Label htmlFor="letter-content" className="mb-2">
                Letter Content
              </Label>
              <Textarea
                id="letter-content"
                value={editedContent}
                onChange={(e) => {
                  setEditedContent(e.target.value);
                  setIsEditing(true);
                }}
                className="flex-1 font-mono text-sm resize-none"
                placeholder="Enter letter content..."
              />
            </div>
            
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{wordCount} words, {charCount} characters</span>
              {isEditing && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  className="h-7"
                >
                  Reset to Original
                </Button>
              )}
            </div>
          </TabsContent>

          <TabsContent value="preview" className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 overflow-auto border rounded-lg p-6 bg-white">
              <div className="max-w-3xl mx-auto">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                  {editedContent}
                </pre>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <div className="flex gap-2 flex-1">
            <Button
              variant="outline"
              onClick={() => handleDownload('txt')}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              TXT
            </Button>
            <Button
              variant="outline"
              onClick={() => handleDownload('pdf')}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              PDF
            </Button>
            <Button
              variant="outline"
              onClick={() => handleDownload('docx')}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              DOCX
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="gap-2">
              <Save className="h-4 w-4" />
              Save Letter
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LetterEditDialog;
