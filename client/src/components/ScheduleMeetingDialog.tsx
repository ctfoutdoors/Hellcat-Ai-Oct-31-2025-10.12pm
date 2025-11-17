import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Clock, MapPin, Users } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface ScheduleMeetingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: "customer" | "lead";
  entityId: number;
  entityName: string;
}

export function ScheduleMeetingDialog({
  open,
  onOpenChange,
  entityType,
  entityId,
  entityName,
}: ScheduleMeetingDialogProps) {
  const [summary, setSummary] = useState(`Meeting with ${entityName}`);
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [attendees, setAttendees] = useState("");
  const [autoCreateTask, setAutoCreateTask] = useState(true);

  const saveMeetingMetaMutation = trpc.crm.calendar.saveMeetingMeta.useMutation();

  const createMeetingMutation = trpc.crm.calendar.createMeeting.useMutation({
    onSuccess: () => {
      toast.success("Meeting scheduled successfully");
      onOpenChange(false);
      // Reset form
      setSummary(`Meeting with ${entityName}`);
      setDescription("");
      setLocation("");
      setStartDate("");
      setStartTime("");
      setEndTime("");
      setAttendees("");
    },
    onError: (error) => {
      toast.error(`Failed to schedule meeting: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!startDate || !startTime || !endTime) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Combine date and time into ISO 8601 format
    const startDateTime = `${startDate}T${startTime}:00`;
    const endDateTime = `${startDate}T${endTime}:00`;

    // Parse attendees (comma-separated emails)
    const attendeeList = attendees
      .split(",")
      .map((email) => email.trim())
      .filter((email) => email.length > 0);

    const meetingPayload = {
      entityType,
      entityId,
      summary,
      description,
      location,
      startTime: startDateTime,
      endTime: endDateTime,
      attendees: attendeeList.length > 0 ? attendeeList : undefined,
    };

    createMeetingMutation.mutate(meetingPayload, {
      onSuccess: (data: any) => {
        // Save meeting metadata for auto-task creation
        if (data?.eventId && autoCreateTask) {
          saveMeetingMetaMutation.mutate({
            eventId: data.eventId,
            entityType,
            entityId,
            summary,
            description,
            startTime: new Date(startDateTime),
            endTime: new Date(endDateTime),
            autoTaskEnabled: true,
          });
        }
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Schedule Meeting</DialogTitle>
          <DialogDescription>
            Create a Google Calendar event for {entityName}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="summary">
                <Calendar className="inline w-4 h-4 mr-2" />
                Meeting Title *
              </Label>
              <Input
                id="summary"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="e.g., Product Demo, Follow-up Call"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Meeting agenda, topics to discuss..."
                rows={3}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="location">
                <MapPin className="inline w-4 h-4 mr-2" />
                Location
              </Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Office, Zoom link, phone number..."
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-3 sm:col-span-1">
                <Label htmlFor="startDate">
                  <Clock className="inline w-4 h-4 mr-2" />
                  Date *
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="startTime">Start Time *</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="endTime">End Time *</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="attendees">
                <Users className="inline w-4 h-4 mr-2" />
                Attendees
              </Label>
              <Input
                id="attendees"
                value={attendees}
                onChange={(e) => setAttendees(e.target.value)}
                placeholder="email1@example.com, email2@example.com"
              />
              <p className="text-xs text-muted-foreground">
                Comma-separated email addresses
              </p>
            </div>

            {/* Auto-create task option */}
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border">
              <div className="flex-1">
                <label className="text-sm font-medium cursor-pointer" htmlFor="autoTask">
                  Auto-create follow-up task
                </label>
                <p className="text-xs text-muted-foreground">
                  Automatically create a task when this meeting ends
                </p>
              </div>
              <input
                id="autoTask"
                type="checkbox"
                checked={autoCreateTask}
                onChange={(e) => setAutoCreateTask(e.target.checked)}
                className="h-4 w-4 cursor-pointer"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createMeetingMutation.isPending}>
              {createMeetingMutation.isPending ? "Scheduling..." : "Schedule Meeting"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
