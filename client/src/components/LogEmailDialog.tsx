import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { X, Mail } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface LogEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: "customer" | "vendor" | "lead" | "contact";
  entityId: number;
  entityName: string;
}

export function LogEmailDialog({
  open,
  onOpenChange,
  entityType,
  entityId,
  entityName,
}: LogEmailDialogProps) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [direction, setDirection] = useState<"sent" | "received">("sent");
  const [visibility, setVisibility] = useState<"private" | "public" | "shared">("private");
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);

  const utils = trpc.useUtils();
  const logEmailMutation = trpc.email.logEmail.useMutation({
    onSuccess: () => {
      toast.success("Email logged successfully");
      onOpenChange(false);
      resetForm();
      // Invalidate email logs query
      utils.email.getEntityEmails.invalidate({ entityType, entityId });
    },
    onError: (error) => {
      toast.error(`Failed to log email: ${error.message}`);
    },
  });

  const resetForm = () => {
    setSubject("");
    setBody("");
    setDirection("sent");
    setVisibility("private");
    setSelectedMembers([]);
  };

  const handleSubmit = () => {
    if (!subject.trim()) {
      toast.error("Subject is required");
      return;
    }

    logEmailMutation.mutate({
      entityType,
      entityId,
      subject,
      body,
      direction,
      visibility,
      sharedWithUserIds: visibility === "shared" ? selectedMembers : undefined,
    });
  };

  // Mock team members - in production, fetch from API
  const teamMembers = [
    { id: 1, name: "John Doe", email: "john@example.com" },
    { id: 2, name: "Jane Smith", email: "jane@example.com" },
    { id: 3, name: "Bob Johnson", email: "bob@example.com" },
  ];

  const toggleMember = (memberId: number) => {
    setSelectedMembers(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Log Email with {entityName}
          </DialogTitle>
          <DialogDescription>
            Record an email conversation for your CRM records. Choose visibility settings to control who can see this email.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Direction */}
          <div className="space-y-2">
            <Label>Direction</Label>
            <Select value={direction} onValueChange={(v) => setDirection(v as "sent" | "received")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sent">Sent to {entityName}</SelectItem>
                <SelectItem value="received">Received from {entityName}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              placeholder="Email subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          {/* Body */}
          <div className="space-y-2">
            <Label htmlFor="body">Email Content</Label>
            <Textarea
              id="body"
              placeholder="Email body or summary..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
            />
          </div>

          {/* Visibility Settings */}
          <div className="space-y-3 pt-4 border-t">
            <Label>Visibility Settings</Label>
            <RadioGroup value={visibility} onValueChange={(v) => setVisibility(v as any)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="private" id="private" />
                <Label htmlFor="private" className="font-normal cursor-pointer">
                  <div>
                    <div className="font-medium">Private</div>
                    <div className="text-sm text-muted-foreground">Only you can see this email</div>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="public" id="public" />
                <Label htmlFor="public" className="font-normal cursor-pointer">
                  <div>
                    <div className="font-medium">Public</div>
                    <div className="text-sm text-muted-foreground">All team members can see this email</div>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="shared" id="shared" />
                <Label htmlFor="shared" className="font-normal cursor-pointer">
                  <div>
                    <div className="font-medium">Shared with specific members</div>
                    <div className="text-sm text-muted-foreground">Choose who can see this email</div>
                  </div>
                </Label>
              </div>
            </RadioGroup>

            {/* Team Member Selector (shown when visibility is "shared") */}
            {visibility === "shared" && (
              <div className="space-y-2 pl-6">
                <Label className="text-sm">Select team members</Label>
                <div className="flex flex-wrap gap-2">
                  {teamMembers.map((member) => (
                    <Badge
                      key={member.id}
                      variant={selectedMembers.includes(member.id) ? "default" : "outline"}
                      className="cursor-pointer hover:bg-primary/80"
                      onClick={() => toggleMember(member.id)}
                    >
                      {member.name}
                      {selectedMembers.includes(member.id) && (
                        <X className="w-3 h-3 ml-1" />
                      )}
                    </Badge>
                  ))}
                </div>
                {selectedMembers.length === 0 && (
                  <p className="text-sm text-muted-foreground">Select at least one team member</p>
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={logEmailMutation.isPending || !subject.trim()}
          >
            {logEmailMutation.isPending ? "Logging..." : "Log Email"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
