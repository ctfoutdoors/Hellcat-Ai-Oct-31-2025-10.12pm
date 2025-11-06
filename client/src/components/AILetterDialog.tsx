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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Sparkles, Download, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';

interface AILetterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseId: number;
  caseNumber: string;
}

const AILetterDialog: React.FC<AILetterDialogProps> = ({
  open,
  onOpenChange,
  caseId,
  caseNumber,
}) => {
  const [tone, setTone] = useState<'professional' | 'firm' | 'conciliatory'>('professional');
  const [includeDeadline, setIncludeDeadline] = useState(true);
  const [includeLegalLanguage, setIncludeLegalLanguage] = useState(false);
  const [requestExpedited, setRequestExpedited] = useState(false);
  const [generatedLetter, setGeneratedLetter] = useState('');
  const [editedLetter, setEditedLetter] = useState('');
  const [copied, setCopied] = useState(false);
  
  const generateMutation = trpc.documentsV2.generateAILetter.useMutation();

  const handleGenerate = async () => {
    try {
      const result = await generateMutation.mutateAsync({
        caseId,
        tone,
        includeDeadline,
        includeLegalLanguage,
        requestExpedited,
      });
      
      setGeneratedLetter(result.letter);
      setEditedLetter(result.letter);
      toast.success('AI letter generated successfully');
    } catch (error: any) {
      toast.error(`Failed to generate letter: ${error.message}`);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(editedLetter);
    setCopied(true);
    toast.success('Letter copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const storePatternMutation = trpc.letterPatterns.store.useMutation();

  const handleDownload = async () => {
    // Store letter pattern for learning
    try {
      await storePatternMutation.mutateAsync({
        caseId,
        letterContent: editedLetter,
        tone,
      });
    } catch (error) {
      console.error('Failed to store letter pattern:', error);
    }

    const blob = new Blob([editedLetter], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-dispute-letter-${caseNumber}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Letter downloaded');
  };

  const handleReset = () => {
    setGeneratedLetter('');
    setEditedLetter('');
    setTone('professional');
    setIncludeDeadline(true);
    setIncludeLegalLanguage(false);
    setRequestExpedited(false);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      onOpenChange(isOpen);
      if (!isOpen) {
        handleReset();
      }
    }}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            AI Dispute Letter Generator
          </DialogTitle>
          <DialogDescription>
            Generate a professional dispute letter using AI, then edit before sending
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto space-y-4">
          {/* Options */}
          {!generatedLetter && (
            <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tone</Label>
                  <Select value={tone} onValueChange={(value: any) => setTone(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="firm">Firm</SelectItem>
                      <SelectItem value="conciliatory">Conciliatory</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="deadline"
                    checked={includeDeadline}
                    onCheckedChange={(checked) => setIncludeDeadline(checked as boolean)}
                  />
                  <label
                    htmlFor="deadline"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Include response deadline (15 business days)
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="legal"
                    checked={includeLegalLanguage}
                    onCheckedChange={(checked) => setIncludeLegalLanguage(checked as boolean)}
                  />
                  <label
                    htmlFor="legal"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Include legal language and regulations
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="expedited"
                    checked={requestExpedited}
                    onCheckedChange={(checked) => setRequestExpedited(checked as boolean)}
                  />
                  <label
                    htmlFor="expedited"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Request expedited review
                  </label>
                </div>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={generateMutation.isPending}
                className="w-full"
              >
                {generateMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating with AI...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate AI Letter
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Editor */}
          {generatedLetter && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Edit Letter (AI-Generated)</Label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditedLetter(generatedLetter)}
                  >
                    Reset to Original
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              </div>
              <Textarea
                value={editedLetter}
                onChange={(e) => setEditedLetter(e.target.value)}
                rows={20}
                className="font-mono text-sm"
                placeholder="AI-generated letter will appear here..."
              />
            </div>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              handleReset();
            }}
          >
            Cancel
          </Button>
          {generatedLetter && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button
                onClick={() => {
                  handleCopy();
                  toast.success('Letter ready to paste into your email client');
                }}
              >
                Copy & Close
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AILetterDialog;
