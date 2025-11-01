import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, CheckCircle, XCircle, Clock, AlertCircle, DollarSign, FileText, Play } from 'lucide-react';

export default function ResponseTracking() {
  const [selectedEmail, setSelectedEmail] = useState<any>(null);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [confirmedResponseType, setConfirmedResponseType] = useState<string>('');
  const [confirmedStatus, setConfirmedStatus] = useState<string>('');
  const [reviewNotes, setReviewNotes] = useState('');

  const utils = trpc.useUtils();

  // Queries
  const { data: unprocessedEmails, isLoading: unprocessedLoading } = trpc.carrierResponses.getUnprocessedEmails.useQuery();
  const { data: processedResponses, isLoading: processedLoading } = trpc.carrierResponses.getProcessedResponses.useQuery({});
  const { data: stats } = trpc.carrierResponses.getResponseStats.useQuery();

  // Mutations
  const parseEmailMutation = trpc.carrierResponses.parseEmail.useMutation({
    onSuccess: () => {
      toast.success('Email parsed successfully');
      utils.carrierResponses.getUnprocessedEmails.invalidate();
      utils.carrierResponses.getProcessedResponses.invalidate();
      utils.carrierResponses.getResponseStats.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to parse email: ${error.message}`);
    },
  });

  const batchParseMutation = trpc.carrierResponses.batchParseEmails.useMutation({
    onSuccess: () => {
      toast.success('Batch processing complete');
      utils.carrierResponses.getUnprocessedEmails.invalidate();
      utils.carrierResponses.getProcessedResponses.invalidate();
      utils.carrierResponses.getResponseStats.invalidate();
    },
  });

  const confirmResponseMutation = trpc.carrierResponses.confirmParsedResponse.useMutation({
    onSuccess: () => {
      toast.success('Response confirmed');
      setIsReviewDialogOpen(false);
      utils.carrierResponses.getProcessedResponses.invalidate();
    },
  });

  const handleParseEmail = (emailId: number) => {
    parseEmailMutation.mutate({ emailId });
  };

  const handleBatchParse = () => {
    if (!unprocessedEmails || unprocessedEmails.length === 0) {
      toast.error('No unprocessed emails');
      return;
    }

    const emailIds = unprocessedEmails.map(e => e.id);
    batchParseMutation.mutate({ emailIds });
  };

  const handleReviewResponse = (email: any) => {
    setSelectedEmail(email);
    setConfirmedResponseType(email.parsedData?.responseType || '');
    setConfirmedStatus(email.parsedData?.suggestedStatus || '');
    setReviewNotes('');
    setIsReviewDialogOpen(true);
  };

  const handleConfirmResponse = () => {
    if (!selectedEmail) return;

    confirmResponseMutation.mutate({
      emailId: selectedEmail.id,
      confirmedResponseType: confirmedResponseType as any,
      confirmedStatus,
      notes: reviewNotes,
    });
  };

  const getResponseTypeBadge = (type: string) => {
    const config: Record<string, { variant: any; icon: any }> = {
      APPROVED: { variant: 'default', icon: CheckCircle },
      DENIED: { variant: 'destructive', icon: XCircle },
      PENDING: { variant: 'secondary', icon: Clock },
      REQUIRES_INFO: { variant: 'secondary', icon: AlertCircle },
      PAYMENT_ISSUED: { variant: 'default', icon: DollarSign },
      UNKNOWN: { variant: 'outline', icon: FileText },
    };

    const cfg = config[type] || config.UNKNOWN;
    const Icon = cfg.icon;

    return (
      <Badge variant={cfg.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {type.replace('_', ' ')}
      </Badge>
    );
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.9) {
      return <Badge variant="default">High ({Math.round(confidence * 100)}%)</Badge>;
    } else if (confidence >= 0.7) {
      return <Badge variant="secondary">Medium ({Math.round(confidence * 100)}%)</Badge>;
    } else {
      return <Badge variant="destructive">Low ({Math.round(confidence * 100)}%)</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Carrier Response Tracking</h1>
          <p className="text-muted-foreground">AI-powered carrier email analysis and auto-status updates</p>
        </div>
        <Button onClick={handleBatchParse} disabled={batchParseMutation.isPending || !unprocessedEmails || unprocessedEmails.length === 0}>
          {batchParseMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Play className="mr-2 h-4 w-4" />
          Process All ({unprocessedEmails?.length || 0})
        </Button>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Processed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Denied</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.denied}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Avg Confidence</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(stats.averageConfidence * 100)}%</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="unprocessed" className="space-y-4">
        <TabsList>
          <TabsTrigger value="unprocessed">
            Unprocessed ({unprocessedEmails?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="processed">
            Processed ({processedResponses?.length || 0})
          </TabsTrigger>
        </TabsList>

        {/* Unprocessed Emails */}
        <TabsContent value="unprocessed" className="space-y-4">
          {unprocessedLoading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : unprocessedEmails && unprocessedEmails.length > 0 ? (
            <div className="grid gap-4">
              {unprocessedEmails.map((email) => (
                <Card key={email.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{email.subject}</CardTitle>
                        <CardDescription>
                          From: {email.senderEmail} • {new Date(email.receivedAt).toLocaleString()}
                        </CardDescription>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleParseEmail(email.id)}
                        disabled={parseEmailMutation.isPending}
                      >
                        {parseEmailMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Parse'
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3">{email.body}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-12">
                <CheckCircle className="h-12 w-12 text-green-600 mb-4" />
                <p className="text-muted-foreground">All emails have been processed!</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Processed Responses */}
        <TabsContent value="processed" className="space-y-4">
          {processedLoading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : processedResponses && processedResponses.length > 0 ? (
            <div className="grid gap-4">
              {processedResponses.map((email) => (
                <Card key={email.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{email.subject}</CardTitle>
                        <CardDescription>
                          From: {email.senderEmail} • {new Date(email.receivedAt).toLocaleString()}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        {getResponseTypeBadge(email.parsedData?.responseType)}
                        {getConfidenceBadge(email.parsedData?.confidence)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm">{email.parsedData?.summary}</p>
                      
                      {email.parsedData?.confirmationNumber && (
                        <div className="text-sm">
                          <span className="font-semibold">Confirmation #:</span> {email.parsedData.confirmationNumber}
                        </div>
                      )}
                      
                      {email.parsedData?.paymentAmount && (
                        <div className="text-sm">
                          <span className="font-semibold">Payment Amount:</span> ${email.parsedData.paymentAmount.toFixed(2)}
                        </div>
                      )}
                      
                      {email.parsedData?.denialReason && (
                        <div className="text-sm">
                          <span className="font-semibold">Denial Reason:</span> {email.parsedData.denialReason}
                        </div>
                      )}

                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReviewResponse(email)}
                        >
                          Review & Confirm
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-12">
                <p className="text-muted-foreground">No processed responses yet</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Parsed Response</DialogTitle>
            <DialogDescription>
              Confirm or adjust the AI-parsed response data
            </DialogDescription>
          </DialogHeader>

          {selectedEmail && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Email Subject</h4>
                <p className="text-sm text-muted-foreground">{selectedEmail.subject}</p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">AI Summary</h4>
                <p className="text-sm text-muted-foreground">{selectedEmail.parsedData?.summary}</p>
              </div>

              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="responseType">Response Type</Label>
                  <Select value={confirmedResponseType} onValueChange={setConfirmedResponseType}>
                    <SelectTrigger id="responseType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="APPROVED">Approved</SelectItem>
                      <SelectItem value="DENIED">Denied</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="REQUIRES_INFO">Requires Info</SelectItem>
                      <SelectItem value="PAYMENT_ISSUED">Payment Issued</SelectItem>
                      <SelectItem value="UNKNOWN">Unknown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="status">Case Status</Label>
                  <Select value={confirmedStatus} onValueChange={setConfirmedStatus}>
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRAFT">Draft</SelectItem>
                      <SelectItem value="FILED">Filed</SelectItem>
                      <SelectItem value="AWAITING_RESPONSE">Awaiting Response</SelectItem>
                      <SelectItem value="RESOLVED">Resolved</SelectItem>
                      <SelectItem value="DENIED">Denied</SelectItem>
                      <SelectItem value="APPEALING">Appealing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="notes">Review Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Add any notes about this review..."
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReviewDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmResponse} disabled={confirmResponseMutation.isPending}>
              {confirmResponseMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
