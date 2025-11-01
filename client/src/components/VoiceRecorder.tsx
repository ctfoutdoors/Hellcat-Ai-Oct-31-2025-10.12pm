import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, Square, Upload, Loader2, FileAudio } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface VoiceRecorderProps {
  caseId?: number;
  onTranscriptionComplete?: (data: {
    transcription: string;
    summary: string;
    actionItems: string[];
  }) => void;
}

export default function VoiceRecorder({ caseId, onTranscriptionComplete }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const transcribeMutation = trpc.voice.transcribe.useMutation({
    onSuccess: (data) => {
      toast.success("Transcription complete!");
      if (onTranscriptionComplete) {
        onTranscriptionComplete(data);
      }
    },
    onError: (error) => {
      toast.error(`Transcription failed: ${error.message}`);
    },
  });

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

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((track) => track.stop());
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
      toast.info("Recording stopped");
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (16MB limit)
      if (file.size > 16 * 1024 * 1024) {
        toast.error("File size must be less than 16MB");
        return;
      }

      // Check file type
      const validTypes = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/webm", "audio/m4a", "audio/ogg"];
      if (!validTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|webm|m4a|ogg)$/i)) {
        toast.error("Please upload a valid audio file (MP3, WAV, WEBM, M4A, OGG)");
        return;
      }

      setAudioBlob(file);
      setAudioUrl(URL.createObjectURL(file));
      toast.success("Audio file loaded");
    }
  };

  const handleTranscribe = async () => {
    if (!audioBlob) {
      toast.error("No audio to transcribe");
      return;
    }

    // TODO: Upload audio to S3 first, then transcribe from URL
    // For now, show error message
    toast.error("Audio upload to S3 not yet implemented. Please use the built-in transcription API directly.");
    
    // This is a placeholder for the full implementation:
    // 1. Upload audioBlob to S3 using storagePut
    // 2. Get the public URL
    // 3. Call transcribeMutation with the URL
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <FileAudio className="h-5 w-5" />
          Voice Memo & Transcription
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          {!isRecording ? (
            <>
              <Button
                onClick={startRecording}
                variant="default"
                className="flex-1"
              >
                <Mic className="h-4 w-4 mr-2" />
                Start Recording
              </Button>
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="flex-1"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Audio
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </>
          ) : (
            <Button
              onClick={stopRecording}
              variant="destructive"
              className="flex-1"
            >
              <Square className="h-4 w-4 mr-2" />
              Stop Recording
            </Button>
          )}
        </div>

        {audioUrl && (
          <div className="space-y-2">
            <audio src={audioUrl} controls className="w-full" />
            <Button
              onClick={handleTranscribe}
              disabled={transcribeMutation.isPending}
              className="w-full"
            >
              {transcribeMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Transcribing...
                </>
              ) : (
                "Transcribe Audio"
              )}
            </Button>
          </div>
        )}

        {transcribeMutation.data && (
          <div className="space-y-3 p-4 bg-muted rounded-lg">
            <div>
              <h4 className="font-semibold text-sm mb-1">Summary</h4>
              <p className="text-sm text-muted-foreground">{transcribeMutation.data.summary}</p>
            </div>

            {transcribeMutation.data.actionItems.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-1">Action Items</h4>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  {transcribeMutation.data.actionItems.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <h4 className="font-semibold text-sm mb-1">Full Transcription</h4>
              <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                {transcribeMutation.data.transcription}
              </p>
            </div>

            <div className="text-xs text-muted-foreground">
              Duration: {transcribeMutation.data.duration?.toFixed(1)}s | 
              Language: {transcribeMutation.data.language || "auto-detected"}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
