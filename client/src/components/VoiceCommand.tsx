import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Loader2, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

interface VoiceCommandProps {
  onCommand?: (command: string) => void;
}

export default function VoiceCommand({ onCommand }: VoiceCommandProps) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [showPanel, setShowPanel] = useState(false);
  const [, setLocation] = useLocation();
  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== "undefined" && ("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onresult = (event: any) => {
        const current = event.resultIndex;
        const transcriptText = event.results[current][0].transcript;
        setTranscript(transcriptText);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        if (transcript) {
          processCommand(transcript);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
        toast.error("Voice recognition error. Please try again.");
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [transcript]);

  const startListening = () => {
    if (!recognitionRef.current) {
      toast.error("Voice recognition not supported in this browser");
      return;
    }

    setTranscript("");
    setShowPanel(true);
    setIsListening(true);
    
    try {
      recognitionRef.current.start();
      toast.info("Listening... Speak your command");
    } catch (error) {
      console.error("Error starting recognition:", error);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const processCommand = async (command: string) => {
    setIsProcessing(true);
    const lowerCommand = command.toLowerCase();

    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Parse commands
    if (lowerCommand.includes("create") && (lowerCommand.includes("po") || lowerCommand.includes("purchase order"))) {
      // Extract vendor and amount if mentioned
      const vendorMatch = lowerCommand.match(/for\s+(\w+)/);
      const amountMatch = lowerCommand.match(/\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/);
      
      toast.success(`Creating PO${vendorMatch ? ` for ${vendorMatch[1]}` : ""}${amountMatch ? ` - $${amountMatch[1]}` : ""}`);
      setLocation("/purchase-orders");
    } else if (lowerCommand.includes("show") || lowerCommand.includes("view") || lowerCommand.includes("open")) {
      if (lowerCommand.includes("case")) {
        toast.success("Opening Cases");
        setLocation("/cases");
      } else if (lowerCommand.includes("order")) {
        toast.success("Opening Orders");
        setLocation("/orders");
      } else if (lowerCommand.includes("inventory")) {
        toast.success("Opening Inventory");
        setLocation("/inventory");
      } else if (lowerCommand.includes("report")) {
        toast.success("Opening Reports");
        setLocation("/reports");
      } else if (lowerCommand.includes("dashboard")) {
        toast.success("Opening Dashboard");
        setLocation("/");
      }
    } else if (lowerCommand.includes("search")) {
      const searchTerm = lowerCommand.replace(/search\s+(for\s+)?/i, "");
      toast.success(`Searching for: ${searchTerm}`);
    } else {
      toast.info(`Command received: "${command}"`);
      if (onCommand) {
        onCommand(command);
      }
    }

    setIsProcessing(false);
    setTimeout(() => {
      setShowPanel(false);
      setTranscript("");
    }, 2000);
  };

  const exampleCommands = [
    "Create PO for Uline $2,500",
    "Show me all cases",
    "Open inventory",
    "Search for pending orders",
    "View reports",
  ];

  return (
    <>
      {/* Floating Voice Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          size="lg"
          onClick={isListening ? stopListening : startListening}
          className={`rounded-full h-14 w-14 shadow-lg transition-all ${
            isListening ? "bg-red-500 hover:bg-red-600 animate-pulse" : ""
          }`}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : isListening ? (
            <MicOff className="h-6 w-6" />
          ) : (
            <Mic className="h-6 w-6" />
          )}
        </Button>
      </div>

      {/* Voice Command Panel */}
      {showPanel && (
        <div className="fixed bottom-24 right-6 z-50 w-96">
          <Card className="shadow-2xl border-2 border-primary/20">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="text-primary" size={20} />
                  <h3 className="font-semibold">Voice Command</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    stopListening();
                    setShowPanel(false);
                  }}
                >
                  <X size={16} />
                </Button>
              </div>

              {/* Status */}
              <div className="flex items-center gap-2">
                {isListening && (
                  <Badge className="gap-1 animate-pulse">
                    <Mic size={12} />
                    Listening...
                  </Badge>
                )}
                {isProcessing && (
                  <Badge variant="secondary" className="gap-1">
                    <Loader2 size={12} className="animate-spin" />
                    Processing...
                  </Badge>
                )}
              </div>

              {/* Transcript */}
              {transcript && (
                <div className="p-3 rounded-lg bg-muted">
                  <p className="text-sm font-medium mb-1">You said:</p>
                  <p className="text-sm">{transcript}</p>
                </div>
              )}

              {/* Example Commands */}
              {!transcript && !isListening && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Try saying:</p>
                  <div className="space-y-1">
                    {exampleCommands.map((cmd, index) => (
                      <div key={index} className="text-xs p-2 rounded bg-muted/50">
                        "{cmd}"
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Waveform Animation */}
              {isListening && (
                <div className="flex items-center justify-center gap-1 h-12">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1 bg-primary rounded-full animate-pulse"
                      style={{
                        height: `${20 + Math.random() * 30}px`,
                        animationDelay: `${i * 0.1}s`,
                      }}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
