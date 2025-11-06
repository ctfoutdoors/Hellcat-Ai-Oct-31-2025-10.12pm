import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Mail,
  Play,
  Square,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Link as LinkIcon,
  Unlink,
  AlertCircle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

export default function GmailMonitoring() {
  const [pollInterval, setPollInterval] = useState(5);
  const [selectedCaseId, setSelectedCaseId] = useState<number | null>(null);

  // Fetch monitoring status
  const { data: status, refetch: refetchStatus } = trpc.gmailMonitoring.getStatus.useQuery();
  const { data: stats, refetch: refetchStats } = trpc.gmailMonitoring.getStats.useQuery();
  const { data: unlinkedData } = trpc.gmailMonitoring.getUnlinkedEmails.useQuery({
    page: 1,
    pageSize: 50,
  });

  const unlinkedEmails = unlinkedData?.emails || [];

  // Mutations
  const startMutation = trpc.gmailMonitoring.start.useMutation({
    onSuccess: () => {
      toast.success('Gmail monitoring started');
      refetchStatus();
    },
    onError: (error) => {
      toast.error(`Failed to start: ${error.message}`);
    },
  });

  const stopMutation = trpc.gmailMonitoring.stop.useMutation({
    onSuccess: () => {
      toast.success('Gmail monitoring stopped');
      refetchStatus();
    },
    onError: (error) => {
      toast.error(`Failed to stop: ${error.message}`);
    },
  });

  const checkNowMutation = trpc.gmailMonitoring.checkNow.useMutation({
    onSuccess: () => {
      toast.success('Checking inbox now...');
      setTimeout(() => {
        refetchStatus();
        refetchStats();
      }, 2000);
    },
  });

  const linkMutation = trpc.gmailMonitoring.linkEmail.useMutation({
    onSuccess: () => {
      toast.success('Email linked to case');
      refetchStats();
    },
  });

  const handleStart = () => {
    startMutation.mutate({ pollIntervalMinutes: pollInterval });
  };

  const handleStop = () => {
    stopMutation.mutate();
  };

  const handleCheckNow = () => {
    checkNowMutation.mutate();
  };

  const handleLinkEmail = (emailId: number) => {
    if (!selectedCaseId) {
      toast.error('Please select a case first');
      return;
    }
    linkMutation.mutate({ emailId, caseId: selectedCaseId });
  };

  const responseTypeColors: Record<string, string> = {
    approved: 'text-green-500',
    denied: 'text-red-500',
    partial: 'text-yellow-500',
    more_info_needed: 'text-blue-500',
    acknowledged: 'text-gray-500',
    unknown: 'text-gray-400',
  };

  const responseTypeLabels: Record<string, string> = {
    approved: 'Approved',
    denied: 'Denied',
    partial: 'Partial Approval',
    more_info_needed: 'More Info Needed',
    acknowledged: 'Acknowledged',
    unknown: 'Unknown',
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Gmail Monitoring</h1>
        <p className="text-muted-foreground">
          Automatically monitor Gmail for carrier responses and link them to cases
        </p>
      </div>

      {/* Status Card */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Mail className="h-8 w-8 text-primary" />
            <div>
              <h2 className="text-xl font-semibold">Monitoring Status</h2>
              <div className="flex items-center gap-2 mt-1">
                {status?.enabled ? (
                  <>
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-sm text-green-600 dark:text-green-400">
                      Active
                    </span>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 rounded-full bg-gray-400" />
                    <span className="text-sm text-muted-foreground">Inactive</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            {status?.enabled ? (
              <Button
                variant="destructive"
                onClick={handleStop}
                disabled={stopMutation.isPending}
              >
                <Square className="h-4 w-4 mr-2" />
                Stop Monitoring
              </Button>
            ) : (
              <>
                <Select
                  value={pollInterval.toString()}
                  onValueChange={(v) => setPollInterval(parseInt(v))}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Every 1 min</SelectItem>
                    <SelectItem value="5">Every 5 min</SelectItem>
                    <SelectItem value="10">Every 10 min</SelectItem>
                    <SelectItem value="15">Every 15 min</SelectItem>
                    <SelectItem value="30">Every 30 min</SelectItem>
                    <SelectItem value="60">Every hour</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleStart}
                  disabled={startMutation.isPending}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start Monitoring
                </Button>
              </>
            )}
            <Button
              variant="outline"
              onClick={handleCheckNow}
              disabled={checkNowMutation.isPending}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${checkNowMutation.isPending ? 'animate-spin' : ''}`} />
              Check Now
            </Button>
          </div>
        </div>

        {status?.lastCheckedAt && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>
              Last checked {formatDistanceToNow(new Date(status.lastCheckedAt), { addSuffix: true })}
            </span>
          </div>
        )}
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Emails</p>
              <p className="text-2xl font-bold">{stats?.total || 0}</p>
            </div>
            <Mail className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Linked</p>
              <p className="text-2xl font-bold text-green-600">{stats?.linked || 0}</p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Unlinked</p>
              <p className="text-2xl font-bold text-orange-600">{stats?.unlinked || 0}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-orange-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Approved</p>
              <p className="text-2xl font-bold text-green-600">
                {stats?.byType?.approved || 0}
              </p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
        </Card>
      </div>

      {/* Response Type Breakdown */}
      {stats && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Response Types</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Object.entries(stats.byType || {}).map(([type, count]) => (
              <div key={type} className="text-center">
                <p className={`text-2xl font-bold ${responseTypeColors[type]}`}>
                  {count}
                </p>
                <p className="text-sm text-muted-foreground">
                  {responseTypeLabels[type] || type}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Unlinked Emails */}
      {unlinkedEmails.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            Unlinked Emails ({unlinkedEmails.length})
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            These emails couldn't be automatically linked to a case. Review and link them manually.
          </p>

          <div className="space-y-3">
            {unlinkedEmails.map((email) => (
              <div
                key={email.id}
                className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50"
              >
                <Mail className="h-5 w-5 text-muted-foreground mt-1" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{email.subject}</p>
                      <p className="text-sm text-muted-foreground">
                        From: {email.fromEmail}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {email.body}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(email.receivedAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <Input
                      type="number"
                      placeholder="Case ID"
                      className="w-32"
                      onChange={(e) => setSelectedCaseId(parseInt(e.target.value))}
                    />
                    <Button
                      size="sm"
                      onClick={() => handleLinkEmail(email.id)}
                      disabled={linkMutation.isPending}
                    >
                      <LinkIcon className="h-4 w-4 mr-1" />
                      Link to Case
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
