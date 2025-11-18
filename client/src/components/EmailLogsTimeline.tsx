import { Mail, Send, Inbox, Lock, Globe, Users, Eye, EyeOff, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useState } from "react";

interface EmailLog {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  subject: string;
  body?: string;
  direction: "sent" | "received";
  visibility: "private" | "public" | "shared";
  sharedWithUserIds: number[];
  createdAt: string;
}

interface EmailLogsTimelineProps {
  emails: EmailLog[];
  entityType: "customer" | "vendor" | "lead" | "contact";
  entityId: number;
  currentUserId?: number;
}

export function EmailLogsTimeline({ emails, entityType, entityId, currentUserId }: EmailLogsTimelineProps) {
  const [expandedEmails, setExpandedEmails] = useState<Set<number>>(new Set());
  const utils = trpc.useUtils();

  const deleteEmailMutation = trpc.email.deleteEmail.useMutation({
    onSuccess: () => {
      toast.success("Email deleted");
      utils.email.getEntityEmails.invalidate({ entityType, entityId });
    },
    onError: (error) => {
      toast.error(`Failed to delete email: ${error.message}`);
    },
  });

  const toggleExpand = (emailId: number) => {
    setExpandedEmails(prev => {
      const newSet = new Set(prev);
      if (newSet.has(emailId)) {
        newSet.delete(emailId);
      } else {
        newSet.add(emailId);
      }
      return newSet;
    });
  };

  const handleDelete = (emailId: number) => {
    if (confirm("Are you sure you want to delete this email log?")) {
      deleteEmailMutation.mutate({ emailId });
    }
  };

  if (emails.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Mail className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>No email logs found</p>
      </div>
    );
  }

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case "private":
        return <Lock className="w-4 h-4" />;
      case "public":
        return <Globe className="w-4 h-4" />;
      case "shared":
        return <Users className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getVisibilityBadge = (visibility: string) => {
    switch (visibility) {
      case "private":
        return <Badge variant="secondary" className="text-xs">Private</Badge>;
      case "public":
        return <Badge variant="default" className="text-xs bg-green-500">Public</Badge>;
      case "shared":
        return <Badge variant="default" className="text-xs bg-blue-500">Shared</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {emails.map((email) => {
        const isExpanded = expandedEmails.has(email.id);
        const isOwner = currentUserId === email.userId;

        return (
          <Card key={email.id} className="p-4 hover:bg-accent/50 transition-colors">
            <div className="flex items-start gap-3">
              {/* Direction Icon */}
              <div className={`p-2 rounded-lg ${
                email.direction === "sent" 
                  ? "bg-blue-500/10 text-blue-500" 
                  : "bg-green-500/10 text-green-500"
              }`}>
                {email.direction === "sent" ? (
                  <Send className="w-5 h-5" />
                ) : (
                  <Inbox className="w-5 h-5" />
                )}
              </div>

              {/* Email Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm mb-1">{email.subject}</h4>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{email.direction === "sent" ? "Sent by" : "Received from"} {email.userName}</span>
                      <span>•</span>
                      <span>{format(new Date(email.createdAt), "MMM d, yyyy h:mm a")}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getVisibilityBadge(email.visibility)}
                    {isOwner && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => handleDelete(email.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Email Body (expandable) */}
                {email.body && (
                  <div className="mt-2">
                    {isExpanded ? (
                      <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {email.body}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground line-clamp-2">
                        {email.body}
                      </div>
                    )}
                    {email.body.length > 100 && (
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-xs mt-1"
                        onClick={() => toggleExpand(email.id)}
                      >
                        {isExpanded ? (
                          <>
                            <EyeOff className="w-3 h-3 mr-1" />
                            Show less
                          </>
                        ) : (
                          <>
                            <Eye className="w-3 h-3 mr-1" />
                            Show more
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                )}

                {/* Visibility Info */}
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                  {getVisibilityIcon(email.visibility)}
                  <span>
                    {email.visibility === "private" && "Only visible to you"}
                    {email.visibility === "public" && "Visible to all team members"}
                    {email.visibility === "shared" && `Shared with ${email.sharedWithUserIds.length} member${email.sharedWithUserIds.length > 1 ? "s" : ""}`}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
