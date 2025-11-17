import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Plus, Clock, MapPin, Users, Trash2 } from "lucide-react";
import { ScheduleMeetingDialog } from "@/components/ScheduleMeetingDialog";
import { toast } from "sonner";

export default function Calendar() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Fetch upcoming meetings
  const { data: meetings, isLoading, refetch } = trpc.crm.calendar.listMeetings.useQuery({
    startDate: new Date().toISOString(),
  });

  const deleteMeetingMutation = trpc.crm.calendar.deleteMeeting.useMutation({
    onSuccess: () => {
      toast.success("Meeting deleted successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to delete meeting: ${error.message}`);
    },
  });

  const handleDeleteMeeting = (eventId: string, summary: string) => {
    if (confirm(`Delete meeting "${summary}"?`)) {
      deleteMeetingMutation.mutate({ eventId });
    }
  };

  // Group meetings by date
  const meetingsByDate = meetings?.reduce((acc: Record<string, any[]>, meeting: any) => {
    const date = new Date(meeting.start.dateTime || meeting.start.date).toDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(meeting);
    return acc;
  }, {}) || {};

  const sortedDates = Object.keys(meetingsByDate).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <CalendarIcon className="w-8 h-8" />
            Calendar
          </h1>
          <p className="text-muted-foreground">
            Manage your meetings and schedule
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Meeting
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Meetings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{meetings?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {meetings?.filter((m: any) => {
                const meetingDate = new Date(m.start.dateTime || m.start.date);
                const weekFromNow = new Date();
                weekFromNow.setDate(weekFromNow.getDate() + 7);
                return meetingDate <= weekFromNow;
              }).length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {meetings?.filter((m: any) => {
                const meetingDate = new Date(m.start.dateTime || m.start.date);
                return meetingDate.toDateString() === new Date().toDateString();
              }).length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Meetings List */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Meetings</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading meetings...</div>
          ) : sortedDates.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No upcoming meetings</p>
              <p className="text-sm">Schedule a meeting to get started</p>
            </div>
          ) : (
            <div className="space-y-6">
              {sortedDates.map((dateStr) => (
                <div key={dateStr} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="font-semibold text-lg">{dateStr}</div>
                    <Badge variant="secondary">
                      {meetingsByDate[dateStr].length}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {meetingsByDate[dateStr].map((meeting: any) => {
                      const startTime = meeting.start.dateTime
                        ? new Date(meeting.start.dateTime).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "All day";
                      const endTime = meeting.end.dateTime
                        ? new Date(meeting.end.dateTime).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "";

                      return (
                        <Card
                          key={meeting.id}
                          className="hover:shadow-md transition-shadow"
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 space-y-2">
                                <div className="font-medium text-lg">
                                  {meeting.summary}
                                </div>
                                {meeting.description && (
                                  <div className="text-sm text-muted-foreground">
                                    {meeting.description}
                                  </div>
                                )}
                                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    <span>
                                      {startTime}
                                      {endTime && ` - ${endTime}`}
                                    </span>
                                  </div>
                                  {meeting.location && (
                                    <div className="flex items-center gap-1">
                                      <MapPin className="w-4 h-4" />
                                      <span>{meeting.location}</span>
                                    </div>
                                  )}
                                  {meeting.attendees && meeting.attendees.length > 0 && (
                                    <div className="flex items-center gap-1">
                                      <Users className="w-4 h-4" />
                                      <span>{meeting.attendees.length} attendees</span>
                                    </div>
                                  )}
                                </div>
                                {meeting.attendees && meeting.attendees.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {meeting.attendees.map((attendee: any, i: number) => (
                                      <Badge key={i} variant="outline" className="text-xs">
                                        {attendee.email}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  handleDeleteMeeting(meeting.id, meeting.summary)
                                }
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Meeting Dialog */}
      <ScheduleMeetingDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        entityType="customer"
        entityId={0}
        entityName="General Meeting"
      />
    </div>
  );
}
