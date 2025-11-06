import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Mail,
  Phone,
  Calendar,
  FileText,
  CheckSquare,
  MessageSquare,
  Smartphone,
  Plus,
  Filter,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface ActivityTimelineProps {
  contactId?: number;
  companyId?: number;
  dealId?: number;
}

const activityIcons = {
  email: Mail,
  call: Phone,
  meeting: Calendar,
  note: FileText,
  task: CheckSquare,
  sms: MessageSquare,
  whatsapp: Smartphone,
};

const activityColors = {
  email: 'text-blue-500',
  call: 'text-green-500',
  meeting: 'text-purple-500',
  note: 'text-gray-500',
  task: 'text-orange-500',
  sms: 'text-cyan-500',
  whatsapp: 'text-emerald-500',
};

export function ActivityTimeline({ contactId, companyId, dealId }: ActivityTimelineProps) {
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newActivity, setNewActivity] = useState({
    type: 'note' as any,
    subject: '',
    body: '',
  });

  // Fetch activities
  const { data, isLoading, refetch } = trpc.crm.activities.list.useQuery({
    contactId,
    companyId,
    dealId,
    page: 1,
    pageSize: 100,
  });

  const activities = data?.activities || [];

  // Filter activities
  const filteredActivities = useMemo(() => {
    if (typeFilter === 'all') return activities;
    return activities.filter(a => a.type === typeFilter);
  }, [activities, typeFilter]);

  // Create activity mutation
  const createMutation = trpc.crm.activities.create.useMutation({
    onSuccess: () => {
      toast.success('Activity added');
      setShowAddDialog(false);
      setNewActivity({ type: 'note', subject: '', body: '' });
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to add activity: ${error.message}`);
    },
  });

  const handleAddActivity = () => {
    if (!newActivity.subject.trim()) {
      toast.error('Subject is required');
      return;
    }

    createMutation.mutate({
      ...newActivity,
      contactId,
      companyId,
      dealId,
    });
  };

  if (isLoading) {
    return (
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
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Activity Timeline</h3>
        <div className="flex gap-2">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="call">Call</SelectItem>
              <SelectItem value="meeting">Meeting</SelectItem>
              <SelectItem value="note">Note</SelectItem>
              <SelectItem value="task">Task</SelectItem>
              <SelectItem value="sms">SMS</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
            </SelectContent>
          </Select>

          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Activity
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Activity</DialogTitle>
                <DialogDescription>
                  Log a new activity for this record
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Type</label>
                  <Select
                    value={newActivity.type}
                    onValueChange={(value) =>
                      setNewActivity({ ...newActivity, type: value as any })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="note">Note</SelectItem>
                      <SelectItem value="call">Call</SelectItem>
                      <SelectItem value="meeting">Meeting</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="task">Task</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Subject</label>
                  <Input
                    value={newActivity.subject}
                    onChange={(e) =>
                      setNewActivity({ ...newActivity, subject: e.target.value })
                    }
                    placeholder="Brief summary"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Details</label>
                  <Textarea
                    value={newActivity.body}
                    onChange={(e) =>
                      setNewActivity({ ...newActivity, body: e.target.value })
                    }
                    placeholder="Activity details..."
                    rows={4}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowAddDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddActivity}
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending ? 'Adding...' : 'Add Activity'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Timeline */}
      {filteredActivities.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No activities yet</p>
          <p className="text-sm">Add your first activity to get started</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredActivities.map((activity) => {
            const Icon = activityIcons[activity.type];
            const colorClass = activityColors[activity.type];

            return (
              <div key={activity.id} className="flex gap-4 group">
                {/* Icon */}
                <div
                  className={`w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0 ${colorClass}`}
                >
                  <Icon className="h-5 w-5" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{activity.subject}</p>
                      <p className="text-sm text-muted-foreground">
                        {activity.body}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(activity.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>

                  {/* Metadata */}
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span className="capitalize">{activity.type}</span>
                    {activity.duration && (
                      <span>{activity.duration} minutes</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
