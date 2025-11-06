import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Brain,
  MessageSquare,
  Command,
  TrendingUp,
  Download,
  Upload,
  Trash2,
  Search,
  Calendar,
  BarChart3,
  Edit,
  X,
  Plus,
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export default function AIMemoryManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [teachDialogOpen, setTeachDialogOpen] = useState(false);
  const [newCommand, setNewCommand] = useState({
    userPhrase: "",
    intendedAction: "",
    examples: [""],
  });

  // Queries
  const { data: sessions } = trpc.conversations.getSessions.useQuery();
  const { data: customCommands } = trpc.aiEnhancements.getCustomCommands.useQuery();
  const { data: corrections } = trpc.aiEnhancements.getCommandCorrections.useQuery();
  const { data: trainingStats } = trpc.aiEnhancements.getTrainingStats.useQuery();
  const { data: preferences } = trpc.conversations.getPreferences.useQuery();

  // Mutations
  const clearHistory = trpc.conversations.clearHistory.useMutation({
    onSuccess: () => {
      toast.success("Conversation history cleared");
    },
  });

  const deleteCommand = trpc.aiEnhancements.deleteCustomCommand.useMutation({
    onSuccess: () => {
      toast.success("Custom command deleted");
    },
  });

  const teachCommand = trpc.aiEnhancements.teachCommand.useMutation({
    onSuccess: () => {
      toast.success("Command taught successfully!");
      setTeachDialogOpen(false);
      setNewCommand({ userPhrase: "", intendedAction: "", examples: [""] });
    },
  });

  const exportCommands = trpc.aiEnhancements.exportCustomCommands.useQuery(undefined, {
    enabled: false,
  });

  const handleClearHistory = () => {
    if (confirm("Are you sure you want to clear all conversation history? This cannot be undone.")) {
      clearHistory.mutate();
    }
  };

  const handleDeleteCommand = (commandId: string) => {
    if (confirm("Delete this custom command?")) {
      deleteCommand.mutate({ commandId });
    }
  };

  const handleTeachCommand = () => {
    if (!newCommand.userPhrase || !newCommand.intendedAction) {
      toast.error("Please fill in user phrase and intended action");
      return;
    }

    teachCommand.mutate({
      userPhrase: newCommand.userPhrase,
      intendedAction: newCommand.intendedAction,
      examples: newCommand.examples.filter((e) => e.trim() !== ""),
    });
  };

  const handleExportCommands = async () => {
    const result = await exportCommands.refetch();
    if (result.data) {
      const blob = new Blob([result.data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ai-commands-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Commands exported");
    }
  };

  const filteredSessions = sessions?.filter((s) =>
    s.summary?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8 text-purple-600" />
            AI Memory Management
          </h1>
          <p className="text-muted-foreground mt-1">
            View and manage AI chatbot's memory, learned preferences, and conversation history
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Conversations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sessions?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Custom Commands
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trainingStats?.totalCustomCommands || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Corrections Made
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trainingStats?.totalCorrections || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Communication Style
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {preferences?.communicationStyle || "Friendly"}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="conversations" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="conversations">
            <MessageSquare className="h-4 w-4 mr-2" />
            Conversations
          </TabsTrigger>
          <TabsTrigger value="commands">
            <Command className="h-4 w-4 mr-2" />
            Custom Commands
          </TabsTrigger>
          <TabsTrigger value="preferences">
            <TrendingUp className="h-4 w-4 mr-2" />
            Learned Preferences
          </TabsTrigger>
          <TabsTrigger value="stats">
            <BarChart3 className="h-4 w-4 mr-2" />
            Statistics
          </TabsTrigger>
        </TabsList>

        {/* Conversations Tab */}
        <TabsContent value="conversations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Conversation History</CardTitle>
              <CardDescription>
                View and manage your conversation sessions with the AI assistant
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button variant="destructive" onClick={handleClearHistory}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              </div>

              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {filteredSessions && filteredSessions.length > 0 ? (
                  filteredSessions.map((session) => (
                    <Card key={session.sessionId} className="hover:bg-accent/50 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">
                                {new Date(session.startedAt).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-sm font-medium">
                              {session.summary || "No summary available"}
                            </p>
                            {session.page && (
                              <span className="text-xs text-muted-foreground">
                                Page: {session.page}
                              </span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No conversations found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Custom Commands Tab */}
        <TabsContent value="commands" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Custom Commands</CardTitle>
                  <CardDescription>
                    Teach the AI new commands or view your custom command library
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleExportCommands}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  <Button onClick={() => setTeachDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Teach Command
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {customCommands && customCommands.length > 0 ? (
                  customCommands.map((cmd: any) => (
                    <Card key={cmd.id} className="hover:bg-accent/50 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Command className="h-4 w-4 text-purple-600" />
                              <span className="font-medium">{cmd.userPhrase}</span>
                              <span className="text-xs text-muted-foreground">
                                Used {cmd.usageCount} times
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Action: {cmd.intendedAction}
                            </p>
                            {cmd.examples && cmd.examples.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {cmd.examples.map((ex: string, i: number) => (
                                  <span
                                    key={i}
                                    className="text-xs bg-secondary px-2 py-1 rounded"
                                  >
                                    {ex}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCommand(cmd.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No custom commands yet. Teach the AI your first command!
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Learned Preferences Tab */}
        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Learned Preferences</CardTitle>
              <CardDescription>
                View what the AI has learned about your preferences and behavior
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Communication Style</Label>
                  <p className="text-sm text-muted-foreground capitalize">
                    {preferences?.communicationStyle || "Not set"}
                  </p>
                </div>

                <div>
                  <Label>Recommendation Frequency</Label>
                  <p className="text-sm text-muted-foreground capitalize">
                    {preferences?.recommendationFrequency || "Not set"}
                  </p>
                </div>

                <div>
                  <Label>Last Page Visited</Label>
                  <p className="text-sm text-muted-foreground">
                    {preferences?.lastPage || "None"}
                  </p>
                </div>

                <div>
                  <Label>Last Entity Type</Label>
                  <p className="text-sm text-muted-foreground">
                    {preferences?.lastEntityType || "None"}
                  </p>
                </div>
              </div>

              {preferences?.preferredActions && preferences.preferredActions.length > 0 && (
                <div>
                  <Label>Preferred Actions</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {preferences.preferredActions.map((action: string, i: number) => (
                      <span key={i} className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                        {action}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="stats" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Usage Statistics</CardTitle>
              <CardDescription>
                Insights into your AI assistant usage patterns
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                {trainingStats?.mostUsedCommand && (
                  <div>
                    <Label>Most Used Custom Command</Label>
                    <Card className="mt-2">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{trainingStats.mostUsedCommand.userPhrase}</p>
                            <p className="text-sm text-muted-foreground">
                              {trainingStats.mostUsedCommand.intendedAction}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold">{trainingStats.mostUsedCommand.usageCount}</p>
                            <p className="text-xs text-muted-foreground">uses</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {corrections && corrections.length > 0 && (
                  <div>
                    <Label>Recent Corrections</Label>
                    <div className="space-y-2 mt-2">
                      {trainingStats?.recentCorrections?.map((corr: any, i: number) => (
                        <Card key={i}>
                          <CardContent className="p-4">
                            <p className="text-sm">
                              <span className="font-medium">Original:</span> {corr.originalCommand}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              <span className="font-medium">Corrected to:</span> {corr.correctInterpretation}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(corr.correctedAt).toLocaleString()}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Teach Command Dialog */}
      <Dialog open={teachDialogOpen} onOpenChange={setTeachDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Teach New Command</DialogTitle>
            <DialogDescription>
              Teach the AI assistant a new command by providing the phrase you'll use and the action it should take
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="userPhrase">What you'll say</Label>
              <Input
                id="userPhrase"
                placeholder="e.g., Show me high priority cases"
                value={newCommand.userPhrase}
                onChange={(e) =>
                  setNewCommand({ ...newCommand, userPhrase: e.target.value })
                }
              />
            </div>

            <div>
              <Label htmlFor="intendedAction">Intended action</Label>
              <Input
                id="intendedAction"
                placeholder="e.g., filter_cases_high_priority"
                value={newCommand.intendedAction}
                onChange={(e) =>
                  setNewCommand({ ...newCommand, intendedAction: e.target.value })
                }
              />
              <p className="text-xs text-muted-foreground mt-1">
                Use snake_case for action names
              </p>
            </div>

            <div>
              <Label>Example variations (optional)</Label>
              {newCommand.examples.map((example, i) => (
                <div key={i} className="flex gap-2 mt-2">
                  <Input
                    placeholder="e.g., Filter high priority"
                    value={example}
                    onChange={(e) => {
                      const newExamples = [...newCommand.examples];
                      newExamples[i] = e.target.value;
                      setNewCommand({ ...newCommand, examples: newExamples });
                    }}
                  />
                  {i === newCommand.examples.length - 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setNewCommand({
                          ...newCommand,
                          examples: [...newCommand.examples, ""],
                        })
                      }
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setTeachDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleTeachCommand} disabled={teachCommand.isPending}>
              {teachCommand.isPending ? "Teaching..." : "Teach Command"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
