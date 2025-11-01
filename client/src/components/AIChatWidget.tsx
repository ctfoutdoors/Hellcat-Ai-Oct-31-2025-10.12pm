import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Send, X, Minimize2, Maximize2, Loader2, Mic, Square, Paperclip, Settings } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  functionCall?: {
    name: string;
    arguments: any;
    result?: any;
    error?: string;
  };
}

interface AIChatWidgetProps {
  caseId?: number;
  initialOpen?: boolean;
}

interface AgentMode {
  enabled: boolean;
  model: "gpt-4o" | "gpt-4-turbo" | "gpt-3.5-turbo";
}

export default function AIChatWidget({ caseId, initialOpen = false }: AIChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I'm your AI assistant for carrier disputes. I can help you create cases, analyze shipping labels, generate documents, and answer questions about carrier policies. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [agentMode, setAgentMode] = useState<AgentMode>({ enabled: true, model: "gpt-4o" });
  const [isRecording, setIsRecording] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const uploadFileMutation = trpc.files.upload.useMutation();
  const transcribeMutation = trpc.voice.transcribe.useMutation();
  
  const chatMutation = trpc.ai.chat.useMutation({
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.message,
          functionCall: data.functionCall,
        },
      ]);
    },
    onError: (error) => {
      toast.error(`AI Error: ${error.message}`);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I'm sorry, I encountered an error. Please make sure your OpenAI API key is configured in Settings.",
        },
      ]);
    },
  });

  const handleSend = async () => {
    if (!input.trim() || chatMutation.isPending) return;

    const userMessage = input.trim();
    setInput("");

    // Add user message to UI
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);

    // Send to API
    const conversationMessages = messages.map((m) => ({
      role: m.role === "user" ? "user" : m.role === "assistant" ? "assistant" : "system",
      content: m.content,
    }));

    chatMutation.mutate({
      messages: [
        ...conversationMessages,
        { role: "user", content: userMessage },
      ] as any,
      caseId,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach((track) => track.stop());
        
        try {
          // Convert blob to base64
          const reader = new FileReader();
          reader.readAsDataURL(blob);
          reader.onloadend = async () => {
            const base64data = reader.result as string;
            const base64 = base64data.split(',')[1];
            
            // Upload to S3
            toast.info("Uploading voice recording...");
            const uploadResult = await uploadFileMutation.mutateAsync({
              fileName: `voice-memo-${Date.now()}.webm`,
              fileType: "audio/webm",
              fileData: base64,
              caseId,
            });
            
            // Transcribe audio
            toast.info("Transcribing audio...");
            const transcription = await transcribeMutation.mutateAsync({
              audioUrl: uploadResult.url,
            });
            
            // Send transcription to AI
            setInput(transcription.transcription);
            toast.success("Voice memo transcribed!");
            
            // Optionally auto-send
            if (transcription.transcription) {
              handleSendMessage(transcription.transcription);
            }
          };
        } catch (error: any) {
          toast.error(`Failed to process voice recording: ${error.message}`);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.info("Recording started...");
    } catch (error: any) {
      toast.error(`Failed to start recording: ${error.message}`);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileUpload = async (files: File[]) => {
    for (const file of files) {
      try {
        // Convert file to base64
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = async () => {
          const base64data = reader.result as string;
          const base64 = base64data.split(',')[1];
          
          toast.info(`Uploading ${file.name}...`);
          const uploadResult = await uploadFileMutation.mutateAsync({
            fileName: file.name,
            fileType: file.type,
            fileData: base64,
            caseId,
          });
          
          // If it's an audio file, transcribe it
          if (file.type.startsWith('audio/')) {
            toast.info("Transcribing audio...");
            const transcription = await transcribeMutation.mutateAsync({
              audioUrl: uploadResult.url,
            });
            setInput(transcription.transcription);
            toast.success("Audio transcribed!");
          } else if (file.type.startsWith('image/')) {
            // For images, add to chat context
            toast.success(`${file.name} uploaded!`);
            setInput(`[Image uploaded: ${uploadResult.url}] `);
          } else {
            toast.success(`${file.name} uploaded!`);
          }
        };
      } catch (error: any) {
        toast.error(`Failed to upload ${file.name}: ${error.message}`);
      }
    }
  };

  const handleSendMessage = (messageText: string) => {
    if (!messageText.trim()) return;
    
    setMessages((prev) => [
      ...prev,
      { role: "user", content: messageText },
    ]);
    
    const conversationMessages = messages.map((m) => ({
      role: m.role === "user" ? "user" : m.role === "assistant" ? "assistant" : "system",
      content: m.content,
    }));
    
    chatMutation.mutate({
      messages: [
        ...conversationMessages,
        { role: "user", content: messageText },
      ] as any,
      caseId,
    });
    
    setInput("");
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
        size="icon"
      >
        <Bot className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Card
      className={`fixed right-6 z-50 shadow-2xl transition-all ${
        isMinimized
          ? "bottom-6 w-80"
          : "bottom-6 w-96 h-[600px]"
      }`}
    >
      <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <CardTitle className="text-base">AI Assistant</CardTitle>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            {isMinimized ? (
              <Maximize2 className="h-4 w-4" />
            ) : (
              <Minimize2 className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      {!isMinimized && (
        <CardContent className="p-0 flex flex-col h-[calc(600px-73px)]">
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div className="max-w-[85%] space-y-2">
                    <div
                      className={`rounded-lg px-4 py-2 break-words overflow-wrap-anywhere ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      {message.role === "assistant" ? (
                        <div className="text-sm break-words overflow-wrap-anywhere"><Streamdown>{message.content}</Streamdown></div>
                      ) : (
                        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                      )}
                    </div>
                    {message.functionCall && (
                      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2 text-xs break-words">
                        <div className="font-semibold text-blue-700 dark:text-blue-300 mb-1 break-words">
                          🔧 Action: {message.functionCall.name}
                        </div>
                        {message.functionCall.result && (
                          <div className="text-blue-600 dark:text-blue-400 font-mono text-xs overflow-auto max-h-32 break-words">
                            <pre className="whitespace-pre-wrap break-words">{typeof message.functionCall.result === "object" 
                              ? JSON.stringify(message.functionCall.result, null, 2)
                              : message.functionCall.result}</pre>
                          </div>
                        )}
                        {message.functionCall.error && (
                          <div className="text-red-600 dark:text-red-400">
                            Error: {message.functionCall.error}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {chatMutation.isPending && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg px-4 py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="p-4 border-t space-y-3">
            {/* Agent Mode Controls */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Switch
                  checked={agentMode.enabled}
                  onCheckedChange={(checked) => setAgentMode({ ...agentMode, enabled: checked })}
                  id="agent-mode"
                />
                <Label htmlFor="agent-mode" className="cursor-pointer">Agent Mode</Label>
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 px-2">
                    <Settings className="h-3 w-3 mr-1" />
                    {agentMode.model}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48" align="end">
                  <div className="space-y-2">
                    <Label className="text-xs">Model</Label>
                    <Select
                      value={agentMode.model}
                      onValueChange={(value: any) => setAgentMode({ ...agentMode, model: value })}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gpt-4o">GPT-4o (Latest)</SelectItem>
                        <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                        <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Input Area with Drag & Drop */}
            <div
              className={`relative ${isDragging ? "ring-2 ring-primary rounded-lg" : ""}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,audio/*,.pdf"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    if (files.length > 0) {
                      toast.info(`${files.length} file(s) selected. Upload feature coming soon.`);
                    }
                  }}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={chatMutation.isPending}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Button
                  variant={isRecording ? "destructive" : "outline"}
                  size="icon"
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={chatMutation.isPending}
                >
                  {isRecording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything..."
                  disabled={chatMutation.isPending}
                  className="flex-1"
                />
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || chatMutation.isPending}
                  size="icon"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              {isDragging && (
                <div className="absolute inset-0 bg-primary/10 rounded-lg flex items-center justify-center pointer-events-none">
                  <p className="text-sm font-medium">Drop files here</p>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {caseId ? `Context: Case #${caseId}` : "General assistance"} • {agentMode.enabled ? "Agent mode active" : "Chat mode"}
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
