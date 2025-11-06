import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Mic, MicOff, Send, Sparkles, Volume2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface AIVoiceAssistantProps {
  page: string;
  entityType?: string;
  entityId?: number;
  entityData?: any;
  onActionExecute?: (actionId: string, actionData?: any) => void;
}

export function AIVoiceAssistant({
  page,
  entityType,
  entityId,
  entityData,
  onActionExecute,
}: AIVoiceAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([
    {
      role: "assistant",
      content: "Hi! I'm your AI assistant. You can ask me for recommendations or give me voice commands like 'Create a case' or 'Export to PDF'.",
    },
  ]);

  // tRPC mutations for conversation management
  const createSession = trpc.conversations.createSession.useMutation();
  const addMessage = trpc.conversations.addMessage.useMutation();
  const getLastSession = trpc.conversations.getLastSession.useQuery(undefined, {
    enabled: isOpen && !sessionId,
  });
  const getSessionHistory = trpc.conversations.getSessionHistory.useQuery(
    { sessionId: sessionId! },
    { enabled: !!sessionId }
  );
  const trackCommand = trpc.conversations.trackCommand.useMutation();
  const preferences = trpc.conversations.getPreferences.useQuery(undefined, {
    enabled: isOpen,
  });

  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sessionInitialized = useRef(false);

  // Initialize or resume session when chatbot opens
  useEffect(() => {  if (isOpen && !sessionId && !sessionInitialized.current) {
      sessionInitialized.current = true;
      
      // Try to resume last session
      if (getLastSession.data && !getLastSession.data.endedAt) {
        setSessionId(getLastSession.data.sessionId);
        toast.success("Resumed previous conversation");
      } else {
        // Create new session
        createSession.mutate(
          { page, entityType, entityId },
          {
            onSuccess: (data) => {
              setSessionId(data.sessionId);
            },
          }
        );
      }
    }
  }, [isOpen, sessionId, getLastSession.data]);

  // Load conversation history when session is set
  useEffect(() => {
    if (sessionId && getSessionHistory.data && getSessionHistory.data.length > 0) {
      const history = getSessionHistory.data.map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      }));
      setMessages(history);
    }
  }, [sessionId, getSessionHistory.data]);

  // Save message to database
  const saveMessage = async (role: "user" | "assistant", content: string) => {
    if (!sessionId) return;
    
    await addMessage.mutateAsync({
      sessionId,
      role,
      content,
      page,
      entityType,
      entityId,
    });
  };

  const executeVoiceCommand = trpc.recommendations.executeVoiceCommand.useMutation();
  const getRecommendations = trpc.recommendations.getRecommendations.useQuery(
    {
      page,
      entityType,
      entityId,
      entityData,
    },
    {
      enabled: isOpen,
    }
  );

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setTranscript(transcript);
        handleVoiceCommand(transcript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
        toast.error("Speech recognition error. Please try again.");
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const startListening = () => {
    if (recognitionRef.current) {
      setIsListening(true);
      setTranscript("");
      recognitionRef.current.start();
    } else {
      toast.error("Speech recognition not supported in this browser");
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const handleVoiceCommand = async (command: string) => {
    // Add user message
    setMessages((prev) => [...prev, { role: "user", content: command }]);
    await saveMessage("user", command);
    
    // Track command usage for learning
    trackCommand.mutate({ command: command.toLowerCase() });

    // Special commands
    if (command.toLowerCase().includes("recommendation") || command.toLowerCase().includes("suggest")) {
      if (getRecommendations.data) {
        const recs = getRecommendations.data.slice(0, 3);
        const recText = recs.map((r) => `• ${r.label}: ${r.reason}`).join("\n");
        const response = `Here are my top recommendations:\n\n${recText}\n\nWould you like me to execute any of these?`;
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: response,
          },
        ]);
        await saveMessage("assistant", response);
      }
      return;
    }

    // Execute command via AI
    try {
      const result = await executeVoiceCommand.mutateAsync({
        command,
        page,
        entityType,
        entityId,
        entityData,
      });

      if (result.success && result.action) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: result.message,
          },
        ]);
        await saveMessage("assistant", result.message);

        // Execute the action
        if (onActionExecute) {
          onActionExecute(result.action, result.actionData);
        }

        toast.success(`Executing: ${result.action}`);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: result.message,
          },
        ]);
        await saveMessage("assistant", result.message);
      }
    } catch (error) {
      console.error("Error executing voice command:", error);
      const errorMsg = "Sorry, I encountered an error processing your command.";
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: errorMsg,
        },
      ]);
      await saveMessage("assistant", errorMsg);
    }
  };

  const handleTextCommand = () => {
    if (transcript.trim()) {
      handleVoiceCommand(transcript);
      setTranscript("");
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 bg-gradient-to-br from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        aria-label="Open AI Assistant"
      >
        <Sparkles className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-96 h-[500px] shadow-2xl z-50 flex flex-col">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">AI Assistant</CardTitle>
              <CardDescription className="text-xs">Voice & text commands</CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-foreground"
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </CardContent>

      <div className="p-4 border-t space-y-2">
        {/* Recommendations */}
        {getRecommendations.data && getRecommendations.data.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Quick actions:</p>
            <div className="flex flex-wrap gap-1">
              {getRecommendations.data.slice(0, 3).map((rec) => (
                <Button
                  key={rec.actionId}
                  variant="outline"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => {
                    if (onActionExecute) {
                      onActionExecute(rec.actionId);
                    }
                    toast.success(`Executing: ${rec.label}`);
                  }}
                >
                  {rec.label}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleTextCommand();
              }
            }}
            placeholder="Type or speak a command..."
            className="flex-1 px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Button
            variant={isListening ? "destructive" : "default"}
            size="sm"
            onClick={isListening ? stopListening : startListening}
            className="shrink-0"
          >
            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
          <Button variant="default" size="sm" onClick={handleTextCommand} className="shrink-0">
            <Send className="h-4 w-4" />
          </Button>
        </div>

        {isListening && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground animate-pulse">
            <Volume2 className="h-3 w-3" />
            Listening...
          </div>
        )}
      </div>
    </Card>
  );
}
