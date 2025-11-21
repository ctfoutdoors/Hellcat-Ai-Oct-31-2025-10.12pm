import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Brain, MessageSquare, Lightbulb, CheckCircle, Radio, Search, Filter } from "lucide-react";
import { Streamdown } from "streamdown";

/**
 * Agent Communications Timeline
 * 
 * Visualizes inter-agent communications, internal thoughts, and decision-making processes
 */
export default function AgentCommunications() {
  const [conversationId, setConversationId] = useState("");
  const [messageTypeFilter, setMessageTypeFilter] = useState<string>("all");
  
  const { data: communications, isLoading } = trpc.agents.getConversation.useQuery(
    { conversationId },
    { enabled: !!conversationId }
  );

  const { data: recentConversations } = trpc.agents.getRecentConversations.useQuery();

  const getMessageIcon = (type: string) => {
    switch (type) {
      case "broadcast":
        return <Radio className="w-5 h-5 text-blue-500" />;
      case "internal_thought":
        return <Lightbulb className="w-5 h-5 text-yellow-500" />;
      case "response":
        return <MessageSquare className="w-5 h-5 text-green-500" />;
      case "decision":
        return <CheckCircle className="w-5 h-5 text-purple-500" />;
      case "request":
        return <MessageSquare className="w-5 h-5 text-orange-500" />;
      default:
        return <MessageSquare className="w-5 h-5 text-gray-500" />;
    }
  };

  const getMessageTypeColor = (type: string) => {
    switch (type) {
      case "broadcast":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "internal_thought":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "response":
        return "bg-green-100 text-green-800 border-green-300";
      case "decision":
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "request":
        return "bg-orange-100 text-orange-800 border-orange-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const filteredCommunications = communications?.filter(
    (comm) => messageTypeFilter === "all" || comm.messageType === messageTypeFilter
  );

  return (
    <div className="container py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2">Agent Communications Timeline</h1>
        <p className="text-muted-foreground">
          View inter-agent conversations, internal reasoning, and decision-making processes
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Select Conversation</CardTitle>
          <CardDescription>
            Choose a conversation ID to view the full communication timeline
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Enter conversation ID (e.g., cross-disc-xxx)"
                value={conversationId}
                onChange={(e) => setConversationId(e.target.value)}
                icon={<Search className="w-4 h-4" />}
              />
            </div>
            <Select value={messageTypeFilter} onValueChange={setMessageTypeFilter}>
              <SelectTrigger className="w-[200px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Messages</SelectItem>
                <SelectItem value="broadcast">Broadcasts</SelectItem>
                <SelectItem value="internal_thought">Internal Thoughts</SelectItem>
                <SelectItem value="request">Requests</SelectItem>
                <SelectItem value="response">Responses</SelectItem>
                <SelectItem value="decision">Decisions</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Recent Conversations */}
          {recentConversations && recentConversations.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Recent Conversations:</p>
              <div className="flex flex-wrap gap-2">
                {recentConversations.map((conv) => (
                  <Button
                    key={conv}
                    variant="outline"
                    size="sm"
                    onClick={() => setConversationId(conv)}
                    className={conversationId === conv ? "bg-primary text-primary-foreground" : ""}
                  >
                    {conv.substring(0, 20)}...
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Communications Timeline */}
      {isLoading && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Loading communications...
          </CardContent>
        </Card>
      )}

      {!isLoading && conversationId && filteredCommunications && filteredCommunications.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No communications found for this conversation ID
          </CardContent>
        </Card>
      )}

      {!isLoading && filteredCommunications && filteredCommunications.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">
              {filteredCommunications.length} Message{filteredCommunications.length !== 1 ? "s" : ""}
            </h2>
            <div className="flex gap-2">
              <Badge variant="outline" className="bg-blue-50">
                {communications?.filter((c) => c.messageType === "broadcast").length} Broadcasts
              </Badge>
              <Badge variant="outline" className="bg-yellow-50">
                {communications?.filter((c) => c.messageType === "internal_thought").length} Thoughts
              </Badge>
              <Badge variant="outline" className="bg-green-50">
                {communications?.filter((c) => c.messageType === "response").length} Responses
              </Badge>
              <Badge variant="outline" className="bg-purple-50">
                {communications?.filter((c) => c.messageType === "decision").length} Decisions
              </Badge>
            </div>
          </div>

          {filteredCommunications.map((comm, index) => (
            <Card key={comm.id} className="border-l-4" style={{
              borderLeftColor: comm.messageType === "broadcast" ? "#3b82f6" :
                comm.messageType === "internal_thought" ? "#eab308" :
                comm.messageType === "response" ? "#22c55e" :
                comm.messageType === "decision" ? "#a855f7" : "#6b7280"
            }}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {getMessageIcon(comm.messageType)}
                    <div>
                      <CardTitle className="text-lg">
                        Agent {comm.senderAgentId}
                        {comm.receiverAgentId && ` → Agent ${comm.receiverAgentId}`}
                        {!comm.receiverAgentId && comm.messageType === "broadcast" && " → All Agents"}
                      </CardTitle>
                      <CardDescription>
                        {new Date(comm.createdAt).toLocaleString()}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className={getMessageTypeColor(comm.messageType)}>
                    {comm.messageType.replace("_", " ").toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Message Content */}
                <div className="prose prose-sm max-w-none">
                  <Streamdown>{comm.content}</Streamdown>
                </div>

                {/* Reasoning */}
                {comm.reasoning && (
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Brain className="w-4 h-4" />
                      Internal Reasoning:
                    </p>
                    <p className="text-sm text-muted-foreground">{comm.reasoning}</p>
                  </div>
                )}

                {/* Confidence */}
                {comm.confidence !== null && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Confidence:</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-xs">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${comm.confidence}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{comm.confidence}%</span>
                  </div>
                )}

                {/* Context */}
                {comm.context && Object.keys(comm.context).length > 0 && (
                  <details className="text-sm">
                    <summary className="cursor-pointer font-medium text-muted-foreground hover:text-foreground">
                      View Context Data
                    </summary>
                    <pre className="mt-2 p-3 bg-muted rounded-lg overflow-x-auto text-xs">
                      {JSON.stringify(comm.context, null, 2)}
                    </pre>
                  </details>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!conversationId && (
        <Card>
          <CardContent className="py-12 text-center">
            <Brain className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Conversation Selected</h3>
            <p className="text-muted-foreground mb-4">
              Enter a conversation ID above to view the agent communication timeline
            </p>
            <p className="text-sm text-muted-foreground">
              Run the cross-disciplinary test script to generate sample conversations
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
