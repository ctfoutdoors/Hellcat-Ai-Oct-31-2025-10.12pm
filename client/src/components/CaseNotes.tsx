import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, MessageSquare } from "lucide-react";

interface CaseNotesProps {
  caseId: number;
}

export default function CaseNotes({ caseId }: CaseNotesProps) {
  const [newNote, setNewNote] = useState("");
  
  const { data: notes, isLoading } = trpc.cases.getNotes.useQuery({ caseId });
  const addNoteMutation = trpc.cases.addNote.useMutation();
  const utils = trpc.useUtils();

  const handleAddNote = async () => {
    if (!newNote.trim()) {
      toast.error("Please enter a note");
      return;
    }

    try {
      await addNoteMutation.mutateAsync({
        caseId,
        content: newNote,
      });
      
      toast.success("Note added successfully");
      setNewNote("");
      utils.cases.getNotes.invalidate({ caseId });
      utils.cases.getActivityLogs.invalidate({ caseId });
    } catch (error: any) {
      toast.error(error.message || "Failed to add note");
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Add Note
          </CardTitle>
          <CardDescription>
            Add internal notes or comments about this case
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Enter your note here..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            rows={4}
          />
          <Button 
            onClick={handleAddNote} 
            disabled={addNoteMutation.isPending || !newNote.trim()}
          >
            {addNoteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add Note
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Notes History</h3>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : notes && notes.length > 0 ? (
          <div className="space-y-3">
            {notes.map((note: any) => (
              <Card key={note.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <MessageSquare className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{note.createdByName || "Unknown User"}</p>
                        <p className="text-sm text-muted-foreground">{formatDate(note.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm whitespace-pre-wrap ml-10">{note.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">No notes yet. Add your first note above.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
