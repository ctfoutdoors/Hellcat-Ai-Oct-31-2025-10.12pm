import { trpc } from '@/lib/trpc';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Mail,
  ArrowDownCircle,
  ArrowUpCircle,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface EmailHistoryProps {
  caseId: number;
}

const responseTypeIcons: Record<string, any> = {
  approved: CheckCircle2,
  denied: XCircle,
  partial: AlertCircle,
  more_info_needed: Clock,
  acknowledged: Mail,
  unknown: Mail,
};

const responseTypeColors: Record<string, string> = {
  approved: 'text-green-500 bg-green-500/10',
  denied: 'text-red-500 bg-red-500/10',
  partial: 'text-yellow-500 bg-yellow-500/10',
  more_info_needed: 'text-blue-500 bg-blue-500/10',
  acknowledged: 'text-gray-500 bg-gray-500/10',
  unknown: 'text-gray-400 bg-gray-400/10',
};

const responseTypeLabels: Record<string, string> = {
  approved: 'Approved',
  denied: 'Denied',
  partial: 'Partial',
  more_info_needed: 'More Info Needed',
  acknowledged: 'Acknowledged',
  unknown: 'Unknown',
};

export function EmailHistory({ caseId }: EmailHistoryProps) {
  const { data, isLoading } = trpc.gmailMonitoring.getLinkedEmails.useQuery({
    caseId,
  });

  const emails = data?.emails || [];

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-4 animate-pulse">
              <div className="w-10 h-10 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (emails.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center py-8 text-muted-foreground">
          <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No email communications yet</p>
          <p className="text-sm mt-1">
            Emails will appear here when carriers respond
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Email History</h3>
        <span className="text-sm text-muted-foreground">
          {emails.length} {emails.length === 1 ? 'email' : 'emails'}
        </span>
      </div>

      <div className="space-y-4">
        {emails.map((email) => {
          const Icon = responseTypeIcons[email.responseType || 'unknown'];
          const colorClass = responseTypeColors[email.responseType || 'unknown'];
          const label = responseTypeLabels[email.responseType || 'unknown'];
          const isInbound = email.direction === 'inbound';

          return (
            <div
              key={email.id}
              className="flex gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              {/* Direction Icon */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                {isInbound ? (
                  <ArrowDownCircle className="h-5 w-5" />
                ) : (
                  <ArrowUpCircle className="h-5 w-5" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-muted-foreground uppercase">
                        {isInbound ? 'Received' : 'Sent'}
                      </span>
                      {isInbound && (
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${colorClass}`}>
                          <Icon className="h-3 w-3" />
                          {label}
                        </span>
                      )}
                      {email.confidence !== null && email.confidence > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {email.confidence}% confidence
                        </span>
                      )}
                    </div>
                    <p className="font-medium truncate">{email.subject}</p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(email.receivedAt || email.sentAt || email.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>

                <div className="text-sm text-muted-foreground mb-2">
                  {isInbound ? (
                    <span>From: {email.fromEmail}</span>
                  ) : (
                    <span>To: {email.toEmail}</span>
                  )}
                </div>

                <p className="text-sm text-muted-foreground line-clamp-2">
                  {email.body}
                </p>

                {/* Extracted Data */}
                {email.extractedData && email.extractedData !== '{}' && (
                  <div className="mt-3 p-3 bg-muted/50 rounded-md">
                    <p className="text-xs font-medium mb-1">Extracted Information:</p>
                    <pre className="text-xs text-muted-foreground overflow-auto">
                      {JSON.stringify(JSON.parse(email.extractedData), null, 2)}
                    </pre>
                  </div>
                )}

                {/* Actions */}
                {email.externalEmailId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    onClick={() => {
                      // TODO: Open email in Gmail
                      window.open(`https://mail.google.com/mail/u/0/#inbox/${email.externalEmailId}`, '_blank');
                    }}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View in Gmail
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
