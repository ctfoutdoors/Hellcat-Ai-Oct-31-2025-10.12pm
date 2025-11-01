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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Send } from 'lucide-react';
import { toast } from 'sonner';

interface BulkEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCaseIds: number[];
  selectedCaseNumbers: string[];
  onSend?: (subject: string, body: string) => Promise<void>;
}

const BulkEmailDialog: React.FC<BulkEmailDialogProps> = ({
  open,
  onOpenChange,
  selectedCaseIds,
  selectedCaseNumbers,
  onSend,
}) => {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!subject.trim()) {
      toast.error('Please enter an email subject');
      return;
    }
    
    if (!body.trim()) {
      toast.error('Please enter an email body');
      return;
    }

    setIsSending(true);
    
    try {
      await onSend?.(subject, body);
      toast.success(`Email sent to ${selectedCaseIds.length} case(s)`);
      setSubject('');
      setBody('');
      onOpenChange(false);
    } catch (error: any) {
      toast.error(`Failed to send emails: ${error.message}`);
    } finally {
      setIsSending(false);
    }
  };

  const insertVariable = (variable: string) => {
    setBody(prev => prev + `{{${variable}}}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send Bulk Email
          </DialogTitle>
          <DialogDescription>
            Send an email to {selectedCaseIds.length} selected case(s)
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col gap-4 overflow-auto">
          {/* Selected Cases */}
          <div className="border rounded-lg p-3 bg-muted/50">
            <Label className="text-sm font-medium mb-2 block">Selected Cases</Label>
            <div className="flex flex-wrap gap-2">
              {selectedCaseNumbers.slice(0, 10).map((caseNumber) => (
                <span
                  key={caseNumber}
                  className="px-2 py-1 bg-primary/10 text-primary rounded text-xs font-medium"
                >
                  {caseNumber}
                </span>
              ))}
              {selectedCaseNumbers.length > 10 && (
                <span className="px-2 py-1 bg-muted text-muted-foreground rounded text-xs">
                  +{selectedCaseNumbers.length - 10} more
                </span>
              )}
            </div>
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="email-subject">Subject</Label>
            <Input
              id="email-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter email subject..."
            />
          </div>

          {/* Body */}
          <div className="space-y-2 flex-1 flex flex-col">
            <div className="flex items-center justify-between">
              <Label htmlFor="email-body">Message</Label>
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => insertVariable('caseNumber')}
                  className="h-7 text-xs"
                >
                  + Case #
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => insertVariable('trackingId')}
                  className="h-7 text-xs"
                >
                  + Tracking
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => insertVariable('carrier')}
                  className="h-7 text-xs"
                >
                  + Carrier
                </Button>
              </div>
            </div>
            <Textarea
              id="email-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Enter email message... Use {{caseNumber}}, {{trackingId}}, {{carrier}} for dynamic content."
              className="flex-1 min-h-[200px] resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Tip: Use variables like {{'{'}caseNumber{'}'}} to personalize each email
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSending}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={isSending} className="gap-2">
            {isSending ? (
              <>Sending...</>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Send to {selectedCaseIds.length} Case(s)
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BulkEmailDialog;
