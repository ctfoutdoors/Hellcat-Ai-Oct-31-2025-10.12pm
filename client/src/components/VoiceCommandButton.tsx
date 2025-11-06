import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

export function VoiceCommandButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [processing, setProcessing] = useState(false);
  const recognitionRef = useRef<any>(null);

  const parseMutation = trpc.voiceCommands.parse.useMutation();
  const { data: commandsData } = trpc.voiceCommands.listByCategory.useQuery();

  useEffect(() => {
    // Check if browser supports speech recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const current = event.resultIndex;
        const transcriptText = event.results[current][0].transcript;
        setTranscript(transcriptText);

        // If final result, process command
        if (event.results[current].isFinal) {
          processCommand(transcriptText);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        toast.error('Speech recognition error: ' + event.error);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startListening = () => {
    if (recognitionRef.current) {
      setTranscript('');
      setIsListening(true);
      recognitionRef.current.start();
    } else {
      toast.error('Speech recognition not supported in this browser');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const processCommand = async (voiceInput: string) => {
    setProcessing(true);
    
    try {
      const result = await parseMutation.mutateAsync({ voiceInput });

      if (result.success && result.command) {
        toast.success(`Command recognized: ${result.command.name}`, {
          description: `Confidence: ${Math.round(result.confidence * 100)}%`,
        });

        // Here you would execute the actual command
        // For now, just show what would be executed
        console.log('Would execute:', result.command.action, 'with params:', result.parameters);
        
        setIsOpen(false);
        setTranscript('');
      } else {
        toast.error(result.message || 'Could not understand command', {
          description: 'Try rephrasing or check available commands',
        });
      }
    } catch (error) {
      console.error('Command processing error:', error);
      toast.error('Failed to process command');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsOpen(true)}
        className="relative"
      >
        <Mic className="h-4 w-4" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Voice Commands</DialogTitle>
            <DialogDescription>
              Click the microphone to speak a command
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Microphone button */}
            <div className="flex flex-col items-center gap-4 py-6">
              <Button
                size="lg"
                variant={isListening ? "destructive" : "default"}
                onClick={isListening ? stopListening : startListening}
                disabled={processing}
                className="h-20 w-20 rounded-full"
              >
                {processing ? (
                  <Loader2 className="h-8 w-8 animate-spin" />
                ) : isListening ? (
                  <MicOff className="h-8 w-8" />
                ) : (
                  <Mic className="h-8 w-8" />
                )}
              </Button>

              {isListening && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                  Listening...
                </div>
              )}

              {transcript && (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">You said:</p>
                  <p className="text-lg font-medium">{transcript}</p>
                </div>
              )}
            </div>

            {/* Available commands by category */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-2">Available Commands ({Object.values(commandsData?.categories || {}).flat().length} total):</h4>
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {Object.entries(commandsData?.categories || {}).map(([category, commands]) => (
                  <div key={category}>
                    <p className="text-xs font-semibold text-muted-foreground mb-1">{category}</p>
                    <div className="space-y-1 ml-2">
                      {commands.slice(0, 3).map((cmd: any) => (
                        <div key={cmd.id} className="text-xs">
                          <p className="font-medium">{cmd.name}</p>
                          <p className="text-xs text-muted-foreground italic">
                            "{cmd.examples[0]}"
                          </p>
                        </div>
                      ))}
                      {commands.length > 3 && (
                        <p className="text-xs text-muted-foreground">+ {commands.length - 3} more...</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
