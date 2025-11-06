import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Loader2, DollarSign, CheckCircle, AlertCircle, Search, Play, Link as LinkIcon } from 'lucide-react';

export default function PaymentReconciliation() {
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [isMatchDialogOpen, setIsMatchDialogOpen] = useState(false);
  const [matchCandidates, setMatchCandidates] = useState<any[]>([]);

  const utils = trpc.useUtils();

  // Queries
  const { data: stats } = trpc.paymentReconciliation.getStats.useQuery();
  const { data: unmatchedPayments, isLoading: unmatchedLoading } = trpc.paymentReconciliation.getUnmatchedPayments.useQuery();
  const { data: matchedPayments, isLoading: matchedLoading } = trpc.paymentReconciliation.getPaymentRecords.useQuery({ status: 'MATCHED' });
  const { data: suggestions, isLoading: suggestionsLoading } = trpc.paymentReconciliation.getMatchingSuggestions.useQuery({ status: 'PENDING' });

  // Mutations
  const autoMatchMutation = trpc.paymentReconciliation.autoMatch.useMutation({
    onSuccess: (data) => {
      toast.success(`Auto-matched ${data.matchedCount} payments`);
      utils.paymentReconciliation.getUnmatchedPayments.invalidate();
      utils.paymentReconciliation.getPaymentRecords.invalidate();
      utils.paymentReconciliation.getStats.invalidate();
      utils.paymentReconciliation.getMatchingSuggestions.invalidate();
    },
    onError: (error) => {
      toast.error(`Auto-match failed: ${error.message}`);
    },
  });

  const findMatchesMutation = trpc.paymentReconciliation.findMatches.useMutation({
    onSuccess: (data) => {
      setMatchCandidates(data);
      setIsMatchDialogOpen(true);
    },
  });

  const confirmMatchMutation = trpc.paymentReconciliation.confirmMatch.useMutation({
    onSuccess: () => {
      toast.success('Payment matched successfully');
      setIsMatchDialogOpen(false);
      utils.paymentReconciliation.getUnmatchedPayments.invalidate();
      utils.paymentReconciliation.getPaymentRecords.invalidate();
      utils.paymentReconciliation.getStats.invalidate();
      utils.paymentReconciliation.getMatchingSuggestions.invalidate();
    },
  });

  const rejectMatchMutation = trpc.paymentReconciliation.rejectMatch.useMutation({
    onSuccess: () => {
      toast.success('Match suggestion rejected');
      utils.paymentReconciliation.getMatchingSuggestions.invalidate();
    },
  });

  const handleFindMatches = (payment: any) => {
    setSelectedPayment(payment);
    findMatchesMutation.mutate({ paymentRecordId: payment.id });
  };

  const handleConfirmMatch = (caseId: number) => {
    if (!selectedPayment) return;

    confirmMatchMutation.mutate({
      paymentRecordId: selectedPayment.id,
      caseId,
      method: 'MANUAL',
    });
  };

  const handleAcceptSuggestion = (suggestion: any) => {
    confirmMatchMutation.mutate({
      paymentRecordId: suggestion.paymentRecordId,
      caseId: suggestion.caseId,
      method: 'AI_SUGGESTED',
    });
  };

  const handleRejectSuggestion = (suggestionId: number) => {
    rejectMatchMutation.mutate({
      suggestionId,
      reason: 'Manually rejected',
    });
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: any; label: string }> = {
      UNMATCHED: { variant: 'destructive', label: 'Unmatched' },
      MATCHED: { variant: 'default', label: 'Matched' },
      DISPUTED: { variant: 'secondary', label: 'Disputed' },
      VERIFIED: { variant: 'default', label: 'Verified' },
    };

    const cfg = config[status] || config.UNMATCHED;

    return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 90) {
      return <Badge variant="default" className="bg-green-600">High ({confidence}%)</Badge>;
    } else if (confidence >= 70) {
      return <Badge variant="secondary">Medium ({confidence}%)</Badge>;
    } else {
      return <Badge variant="outline">Low ({confidence}%)</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Payment Reconciliation</h1>
          <p className="text-muted-foreground">Automatically match carrier payments with filed claims</p>
        </div>
        <Button onClick={() => autoMatchMutation.mutate()} disabled={autoMatchMutation.isPending}>
          {autoMatchMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Play className="mr-2 h-4 w-4" />
          Auto-Match All
        </Button>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPayments}</div>
              <p className="text-xs text-muted-foreground">${stats.totalAmount.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Matched</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.matchedPayments}</div>
              <p className="text-xs text-muted-foreground">${stats.matchedAmount.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Unmatched</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.unmatchedPayments}</div>
              <p className="text-xs text-muted-foreground">${stats.unmatchedAmount.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Avg Match Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageMatchTime.toFixed(1)}h</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="unmatched" className="space-y-4">
        <TabsList>
          <TabsTrigger value="unmatched">
            Unmatched ({unmatchedPayments?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="suggestions">
            AI Suggestions ({suggestions?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="matched">
            Matched ({matchedPayments?.length || 0})
          </TabsTrigger>
        </TabsList>

        {/* Unmatched Payments */}
        <TabsContent value="unmatched" className="space-y-4">
          {unmatchedLoading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : unmatchedPayments && unmatchedPayments.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Unmatched Payments</CardTitle>
                <CardDescription>Payments that need to be matched with cases</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Carrier</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {unmatchedPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>{new Date(payment.paymentDate).toLocaleDateString()}</TableCell>
                        <TableCell className="font-semibold">${payment.paymentAmount.toFixed(2)}</TableCell>
                        <TableCell>{payment.paymentMethod}</TableCell>
                        <TableCell>{payment.carrier || '-'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {payment.carrierReference || payment.checkNumber || '-'}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleFindMatches(payment)}
                            disabled={findMatchesMutation.isPending}
                          >
                            {findMatchesMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Search className="mr-2 h-4 w-4" />
                                Find Matches
                              </>
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-12">
                <CheckCircle className="h-12 w-12 text-green-600 mb-4" />
                <p className="text-muted-foreground">All payments are matched!</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* AI Suggestions */}
        <TabsContent value="suggestions" className="space-y-4">
          {suggestionsLoading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : suggestions && suggestions.length > 0 ? (
            <div className="grid gap-4">
              {suggestions.map((suggestion) => (
                <Card key={suggestion.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">Payment #{suggestion.paymentRecordId} → Case #{suggestion.caseId}</CardTitle>
                        <CardDescription>{suggestion.matchReason}</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        {getConfidenceBadge(suggestion.confidence)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Amount Match</div>
                          <div className="font-semibold">{suggestion.amountMatch}%</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Date Match</div>
                          <div className="font-semibold">{suggestion.dateMatch}%</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Carrier Match</div>
                          <div className="font-semibold">{suggestion.carrierMatch}%</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Reference Match</div>
                          <div className="font-semibold">{suggestion.referenceMatch}%</div>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          onClick={() => handleAcceptSuggestion(suggestion)}
                          disabled={confirmMatchMutation.isPending}
                        >
                          {confirmMatchMutation.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle className="mr-2 h-4 w-4" />
                          )}
                          Accept Match
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRejectSuggestion(suggestion.id)}
                          disabled={rejectMatchMutation.isPending}
                        >
                          Reject
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
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No AI suggestions available</p>
                <p className="text-sm text-muted-foreground">Run auto-match to generate suggestions</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Matched Payments */}
        <TabsContent value="matched" className="space-y-4">
          {matchedLoading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : matchedPayments && matchedPayments.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Matched Payments</CardTitle>
                <CardDescription>Successfully reconciled payments</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Case ID</TableHead>
                      <TableHead>Carrier</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Matched</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {matchedPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>{new Date(payment.paymentDate).toLocaleDateString()}</TableCell>
                        <TableCell className="font-semibold">${payment.paymentAmount.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">#{payment.caseId}</Badge>
                        </TableCell>
                        <TableCell>{payment.carrier || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{payment.matchMethod}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {payment.matchedAt ? new Date(payment.matchedAt).toLocaleDateString() : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-12">
                <p className="text-muted-foreground">No matched payments yet</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Match Dialog */}
      <Dialog open={isMatchDialogOpen} onOpenChange={setIsMatchDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Match Payment to Case</DialogTitle>
            <DialogDescription>
              Select the best matching case for this payment
            </DialogDescription>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Amount</div>
                    <div className="font-semibold text-lg">${selectedPayment.paymentAmount.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Date</div>
                    <div className="font-semibold">{new Date(selectedPayment.paymentDate).toLocaleDateString()}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Carrier</div>
                    <div className="font-semibold">{selectedPayment.carrier || 'Unknown'}</div>
                  </div>
                </div>
              </div>

              {findMatchesMutation.isPending ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : matchCandidates.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {matchCandidates.map((candidate) => (
                    <Card key={candidate.caseId} className="cursor-pointer hover:bg-muted/50 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-semibold">Case #{candidate.caseId}</span>
                              {getConfidenceBadge(candidate.confidence)}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{candidate.matchReason}</p>
                            <div className="grid grid-cols-4 gap-2 text-xs">
                              <div>
                                <div className="text-muted-foreground">Amount</div>
                                <div>{candidate.amountMatch}%</div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">Date</div>
                                <div>{candidate.dateMatch}%</div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">Carrier</div>
                                <div>{candidate.carrierMatch}%</div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">Reference</div>
                                <div>{candidate.referenceMatch}%</div>
                              </div>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleConfirmMatch(candidate.caseId)}
                            disabled={confirmMatchMutation.isPending}
                          >
                            {confirmMatchMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <LinkIcon className="mr-2 h-4 w-4" />
                                Match
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No matching cases found</p>
                  <p className="text-sm text-muted-foreground">Try adjusting the search criteria</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMatchDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
