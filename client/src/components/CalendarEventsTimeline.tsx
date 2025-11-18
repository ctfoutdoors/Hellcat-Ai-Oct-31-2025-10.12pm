import { Calendar, MapPin, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface CalendarEvent {
  id: number;
  title: string;
  description?: string;
  location?: string;
  startTime: string;
  endTime: string;
  allDay: boolean;
  attendees: string[];
  organizerEmail?: string;
  status: string;
  provider: string;
  calendarName?: string;
  providerAccountEmail?: string;
}

interface CalendarEventsTimelineProps {
  events: CalendarEvent[];
}

export function CalendarEventsTimeline({ events }: CalendarEventsTimelineProps) {
  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>No calendar events found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {events.map((event) => {
        const startDate = new Date(event.startTime);
        const endDate = new Date(event.endTime);
        const isUpcoming = startDate > new Date();
        const isPast = endDate < new Date();
        const isOngoing = !isUpcoming && !isPast;

        return (
          <Card key={event.id} className="p-4 hover:bg-accent/50 transition-colors">
            <div className="flex items-start gap-3">
              {/* Calendar Icon */}
              <div className={`p-2 rounded-lg ${
                isOngoing ? "bg-green-500/10 text-green-500" :
                isUpcoming ? "bg-blue-500/10 text-blue-500" :
                "bg-gray-500/10 text-gray-500"
              }`}>
                <Calendar className="w-5 h-5" />
              </div>

              {/* Event Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className="font-medium text-sm">{event.title}</h4>
                  <div className="flex items-center gap-2">
                    {isOngoing && (
                      <Badge variant="default" className="bg-green-500 text-white">
                        Ongoing
                      </Badge>
                    )}
                    {isUpcoming && (
                      <Badge variant="default" className="bg-blue-500 text-white">
                        Upcoming
                      </Badge>
                    )}
                    {isPast && event.status === "cancelled" && (
                      <Badge variant="destructive">
                        Cancelled
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs">
                      {event.provider === "google" ? "Google Calendar" : event.provider}
                    </Badge>
                  </div>
                </div>

                {/* Time */}
                <div className="text-sm text-muted-foreground mb-2">
                  {event.allDay ? (
                    <span>All day - {format(startDate, "MMM d, yyyy")}</span>
                  ) : (
                    <span>
                      {format(startDate, "MMM d, yyyy h:mm a")} - {format(endDate, "h:mm a")}
                    </span>
                  )}
                </div>

                {/* Description */}
                {event.description && (
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                    {event.description}
                  </p>
                )}

                {/* Location */}
                {event.location && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                    <MapPin className="w-4 h-4" />
                    <span>{event.location}</span>
                  </div>
                )}

                {/* Attendees */}
                {event.attendees && event.attendees.length > 0 && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>{event.attendees.length} attendee{event.attendees.length > 1 ? "s" : ""}</span>
                  </div>
                )}

                {/* Calendar Source */}
                {event.calendarName && (
                  <div className="text-xs text-muted-foreground mt-2">
                    From: {event.calendarName} ({event.providerAccountEmail})
                  </div>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
