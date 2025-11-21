import { useState, useRef } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, Sparkles, Users, Brain, Zap, Mic, MicOff } from 'lucide-react';
import { toast } from 'sonner';

export default function AIAgents() {
  const [command, setCommand] = useState('');
  const [isInitializing, setIsInitializing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  const { data: agents, isLoading: loadingAgents, refetch: refetchAgents } = trpc.aiAgents.listAgents.useQuery();
  const { data: conversations, refetch: refetchConversations } = trpc.aiAgents.getConversations.useQuery({ limit: 10 });
  const { data: tasks } = trpc.aiAgents.getTasks.useQuery({ limit: 20 });
  
  const initSystemMutation = trpc.aiAgents.initializeSystem.useMutation({
    onSuccess: (data) => {
      toast.success(`AI System Initialized: CEO + ${data.cSuite.length} C-Suite Executives`);
      refetchAgents();
      setIsInitializing(false);
    },
    onError: (error) => {
      toast.error(`Initialization failed: ${error.message}`);
      setIsInitializing(false);
    },
  });
  
  const commandMutation = trpc.aiAgents.commandMasterAgent.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        toast.success('Command executed successfully');
      } else {
        toast.error(result.error || 'Command failed');
      }
      setCommand('');
      refetchConversations();
      refetchAgents();
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });
  
  const handleInitialize = () => {
    setIsInitializing(true);
    initSystemMutation.mutate();
  };
  
  const handleSendCommand = () => {
    if (!command.trim()) return;
    commandMutation.mutate({ command: command.trim() });
  };
  
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await transcribeAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast.error('Failed to access microphone. Please check permissions.');
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };
  
  const transcribeAudio = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    
    try {
      // Upload audio to S3 first
      const formData = new FormData();
      formData.append('file', audioBlob, 'voice-command.webm');
      
      // For now, we'll use a simple approach - in production, you'd upload to S3
      // and then call the Whisper API endpoint
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          // This is a placeholder - you'll need to implement the actual transcription endpoint
          toast.info('Voice transcription coming soon! For now, please type your command.');
          setIsTranscribing(false);
        } catch (error) {
          console.error('Transcription error:', error);
          toast.error('Failed to transcribe audio');
          setIsTranscribing(false);
        }
      };
      reader.readAsDataURL(audioBlob);
    } catch (error) {
      console.error('Error transcribing audio:', error);
      toast.error('Failed to transcribe audio');
      setIsTranscribing(false);
    }
  };
  
  const ceo = agents?.find(a => a.role === 'ceo');
  const cSuite = agents?.filter(a => a.level === 'c_suite' && a.role !== 'ceo') || [];
  const specialists = agents?.filter(a => a.level === 'specialist') || [];
  
  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            AI Agent System
          </h1>
          <p className="text-muted-foreground mt-1">
            Enterprise AI organization with 120+ specialized agents
          </p>
        </div>
        
        {!ceo && (
          <Button 
            onClick={handleInitialize} 
            disabled={isInitializing}
            size="lg"
          >
            {isInitializing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Initializing...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Initialize AI System
              </>
            )}
          </Button>
        )}
      </div>
      
      {/* System Status */}
      {agents && agents.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{agents.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Active AI agents</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">C-Suite Executives</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{cSuite.length + (ceo ? 1 : 0)}</div>
              <p className="text-xs text-muted-foreground mt-1">Executive leadership</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Specialists</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{specialists.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Domain experts</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {tasks?.filter(t => t.status === 'in_progress').length || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">In progress</p>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Master Agent Chat */}
      {ceo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Master Agent Command Center
            </CardTitle>
            <CardDescription>
              Send commands to the CEO (Master Agent) to orchestrate the entire AI organization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Conversation History */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {conversations && conversations.length > 0 ? (
                conversations.map((conv) => (
                  <div key={conv.id} className="space-y-2">
                    {conv.messages && Array.isArray(conv.messages) && conv.messages.map((msg: any, idx: number) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg ${
                          msg.role === 'user'
                            ? 'bg-primary text-primary-foreground ml-8'
                            : 'bg-muted mr-8'
                        }`}
                      >
                        <div className="text-xs opacity-70 mb-1">
                          {msg.role === 'user' ? 'You' : 'Master Agent'}
                        </div>
                        <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                      </div>
                    ))}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Brain className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No conversations yet. Send a command to get started!</p>
                </div>
              )}
            </div>
            
            {/* Command Input */}
            <div className="flex gap-2">
              <Input
                placeholder={isRecording ? 'Recording...' : isTranscribing ? 'Transcribing...' : "Enter command for Master Agent (or use voice)"}
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendCommand();
                  }
                }}
                disabled={commandMutation.isPending || isRecording || isTranscribing}
              />
              <Button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={commandMutation.isPending || isTranscribing}
                variant={isRecording ? 'destructive' : 'outline'}
                size="icon"
              >
                {isTranscribing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isRecording ? (
                  <MicOff className="h-4 w-4" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </Button>
              <Button
                onClick={handleSendCommand}
                disabled={!command.trim() || commandMutation.isPending || isRecording || isTranscribing}
              >
                {commandMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            {/* Example Commands */}
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-muted-foreground">Examples:</span>
              {[
                'Analyze revenue trends',
                'Create financial forecast',
                'Review customer satisfaction',
                'Optimize inventory levels',
              ].map((example) => (
                <Badge
                  key={example}
                  variant="outline"
                  className="cursor-pointer hover:bg-accent"
                  onClick={() => setCommand(example)}
                >
                  {example}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Agent Directory */}
      {agents && agents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Agent Directory
            </CardTitle>
            <CardDescription>
              All active AI agents in the organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* CEO */}
            {ceo && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-yellow-500" />
                  Chief Executive Officer (Master Agent)
                </h3>
                <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{ceo.name}</div>
                      <div className="text-sm text-muted-foreground">{ceo.role.toUpperCase()}</div>
                    </div>
                    <Badge variant="default">Active</Badge>
                  </div>
                  {ceo.capabilities && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {Object.entries(ceo.capabilities as Record<string, any>).map(([key, value]) => 
                        value && <Badge key={key} variant="outline" className="text-xs">{key}</Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* C-Suite */}
            {cSuite.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold mb-3">C-Suite Executives</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {cSuite.map((agent) => (
                    <div key={agent.id} className="border rounded-lg p-3">
                      <div className="font-medium">{agent.name}</div>
                      <div className="text-xs text-muted-foreground">{agent.role.toUpperCase()}</div>
                      <div className="mt-2">
                        <Badge variant="secondary" className="text-xs">
                          {agent.status || 'Active'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Specialists */}
            {specialists.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-3">Specialist Agents</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                  {specialists.map((agent) => (
                    <div key={agent.id} className="border rounded p-2">
                      <div className="text-sm font-medium truncate">{agent.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{agent.role}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* No Agents State */}
      {!loadingAgents && (!agents || agents.length === 0) && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Brain className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">AI System Not Initialized</h3>
              <p className="text-muted-foreground mb-6">
                Click "Initialize AI System" to create the Master Agent and C-Suite executives
              </p>
              <Button onClick={handleInitialize} disabled={isInitializing} size="lg">
                {isInitializing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Initializing...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Initialize AI System
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
