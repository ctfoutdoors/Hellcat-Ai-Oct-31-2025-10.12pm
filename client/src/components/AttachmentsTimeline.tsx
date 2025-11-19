import { File, Download, Trash2, Mail, FileText, Calendar, StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface AttachmentsTimelineProps {
  entityType: "customer" | "vendor" | "lead" | "contact";
  entityId: number;
  activityType?: "email" | "meeting" | "note" | "document" | "other";
}

export function AttachmentsTimeline({ entityType, entityId, activityType }: AttachmentsTimelineProps) {
  const { data: attachments, isLoading, refetch } = trpc.attachments.list.useQuery({
    entityType,
    entityId,
    activityType,
  });

  const deleteMutation = trpc.attachments.delete.useMutation({
    onSuccess: () => {
      toast.success("Attachment deleted");
      refetch();
    },
    onError: (error) => {
      toast.error(`Delete failed: ${error.message}`);
    },
  });

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "email":
        return <Mail className="h-4 w-4" />;
      case "meeting":
        return <Calendar className="h-4 w-4" />;
      case "note":
        return <StickyNote className="h-4 w-4" />;
      case "document":
        return <FileText className="h-4 w-4" />;
      default:
        return <File className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "email":
        return "bg-blue-500/10 text-blue-500";
      case "meeting":
        return "bg-purple-500/10 text-purple-500";
      case "note":
        return "bg-yellow-500/10 text-yellow-500";
      case "document":
        return "bg-green-500/10 text-green-500";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading attachments...</div>;
  }

  if (!attachments || attachments.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <File className="mx-auto h-12 w-12 mb-2 opacity-50" />
        <p>No attachments found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {attachments.map((attachment) => (
        <div
          key={attachment.id}
          className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
        >
          {/* Activity type icon */}
          <div className={`p-2 rounded-full ${getActivityColor(attachment.activityType)}`}>
            {getActivityIcon(attachment.activityType)}
          </div>

          {/* Attachment details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium truncate">{attachment.fileName}</h4>
                {attachment.isEmailAttachment && attachment.emailSubject && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Subject: {attachment.emailSubject}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  <span>{formatFileSize(attachment.fileSize)}</span>
                  <span>•</span>
                  <span>{formatDistanceToNow(new Date(attachment.createdAt), { addSuffix: true })}</span>
                  {attachment.emailDirection && (
                    <>
                      <span>•</span>
                      <Badge variant="outline" className="text-xs">
                        {attachment.emailDirection}
                      </Badge>
                    </>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                >
                  <a href={attachment.fileUrl} target="_blank" rel="noopener noreferrer" download>
                    <Download className="h-4 w-4" />
                  </a>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (confirm("Are you sure you want to delete this attachment?")) {
                      deleteMutation.mutate({ id: attachment.id });
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
