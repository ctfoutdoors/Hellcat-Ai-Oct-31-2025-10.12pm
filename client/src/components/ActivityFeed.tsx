import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Activity,
  FileText,
  Mail,
  DollarSign,
  UserPlus,
  MessageSquare,
  Workflow,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ActivityFeedProps {
  caseId: number;
  limit?: number;
}

function getActivityIcon(activityType: string) {
  const icons: Record<string, any> = {
    CREATED: FileText,
    UPDATED: FileText,
    STATUS_CHANGED: Activity,
    ASSIGNED: UserPlus,
    REASSIGNED: UserPlus,
    COMMENTED: MessageSquare,
    ATTACHMENT_ADDED: FileText,
    ATTACHMENT_REMOVED: FileText,
    EMAIL_SENT: Mail,
    EMAIL_RECEIVED: Mail,
    PAYMENT_RECEIVED: DollarSign,
    WORKFLOW_STARTED: Workflow,
    WORKFLOW_COMPLETED: CheckCircle2,
    PORTAL_SUBMITTED: Send,
    EVIDENCE_ADDED: FileText,
    LETTER_GENERATED: FileText,
    OTHER: Activity,
  };

  return icons[activityType] || Activity;
}

function getActivityColor(activityType: string) {
  const colors: Record<string, string> = {
    CREATED: 'text-blue-500',
    STATUS_CHANGED: 'text-purple-500',
    ASSIGNED: 'text-green-500',
    REASSIGNED: 'text-yellow-500',
    COMMENTED: 'text-gray-500',
    EMAIL_SENT: 'text-blue-500',
    EMAIL_RECEIVED: 'text-indigo-500',
    PAYMENT_RECEIVED: 'text-green-500',
    WORKFLOW_STARTED: 'text-orange-500',
    WORKFLOW_COMPLETED: 'text-green-500',
    PORTAL_SUBMITTED: 'text-purple-500',
  };

  return colors[activityType] || 'text-gray-500';
}

function getActorBadgeVariant(actorType: string) {
  const variants: Record<string, any> = {
    USER: 'default',
    SYSTEM: 'secondary',
    API: 'outline',
    WORKFLOW: 'outline',
  };

  return variants[actorType] || 'default';
}

function ActivityItem({ log }: { log: any }) {
  const Icon = getActivityIcon(log.activityType);
  const iconColor = getActivityColor(log.activityType);

  return (
    <div className="flex gap-3 pb-4 last:pb-0">
      <div className={`flex-shrink-0 mt-1 ${iconColor}`}>
        <Icon className="h-5 w-5" />
      </div>

      <div className="flex-1 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm">{log.description}</p>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {log.actorName && (
            <span className="text-xs text-muted-foreground">{log.actorName}</span>
          )}
          <Badge variant={getActorBadgeVariant(log.actorType)} className="text-xs">
            {log.actorType}
          </Badge>
        </div>

        {/* Show field changes */}
        {log.fieldChanged && (
          <div className="text-xs text-muted-foreground mt-1">
            <span className="font-medium">{log.fieldChanged}:</span>{' '}
            {log.oldValue && (
              <>
                <span className="line-through">{log.oldValue}</span>
                {' → '}
              </>
            )}
            <span className="font-medium">{log.newValue}</span>
          </div>
        )}

        {/* Show metadata */}
        {log.metadata && (
          <div className="text-xs text-muted-foreground mt-1">
            {log.metadata.preview && (
              <div className="italic">"{log.metadata.preview}"</div>
            )}
            {log.metadata.carrier && (
              <div>Carrier: {log.metadata.carrier}</div>
            )}
            {log.metadata.amount && (
              <div>Amount: ${log.metadata.amount.toFixed(2)}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ActivityFeed({ caseId, limit = 50 }: ActivityFeedProps) {
  const { data: logs, isLoading } = trpc.activityLogs.getByCase.useQuery({
    caseId,
    limit,
  });

  const { data: stats } = trpc.activityLogs.getStats.useQuery({ caseId });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activity Timeline
          </CardTitle>
          {stats && (
            <Badge variant="secondary">{stats.totalActivities} activities</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          {logs && logs.length > 0 ? (
            <div className="space-y-4">
              {logs.map((log: any) => (
                <ActivityItem key={log.id} log={log} />
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              No activity yet
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
