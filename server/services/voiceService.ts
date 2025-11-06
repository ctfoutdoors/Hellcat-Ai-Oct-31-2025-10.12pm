/**
 * Voice Transcription Service
 * Uses OpenAI Whisper API for audio transcription
 */

import { getServiceCredentials } from "./apiService";

const OPENAI_API_BASE = "https://api.openai.com/v1";

interface TranscriptionOptions {
  audioFile: Buffer;
  fileName: string;
  language?: string;
  prompt?: string;
}

interface TranscriptionResponse {
  text: string;
  language?: string;
  duration?: number;
  segments?: Array<{
    id: number;
    start: number;
    end: number;
    text: string;
  }>;
}

/**
 * Get OpenAI API headers
 */
async function getOpenAIHeaders(): Promise<HeadersInit> {
  const credentials = await getServiceCredentials("OPENAI");
  const { api_key } = credentials;

  if (!api_key) {
    throw new Error("OpenAI API key not configured");
  }

  return {
    Authorization: `Bearer ${api_key}`,
  };
}

/**
 * Transcribe audio file to text using Whisper API
 */
export async function transcribeAudio(
  options: TranscriptionOptions
): Promise<TranscriptionResponse> {
  const headers = await getOpenAIHeaders();

  // Create form data
  const formData = new FormData();
  const uint8Array = new Uint8Array(options.audioFile);
  const blob = new Blob([uint8Array], { type: "audio/mpeg" });
  formData.append("file", blob, options.fileName);
  formData.append("model", "whisper-1");

  if (options.language) {
    formData.append("language", options.language);
  }

  if (options.prompt) {
    formData.append("prompt", options.prompt);
  }

  // Request detailed response with timestamps
  formData.append("response_format", "verbose_json");

  const response = await fetch(`${OPENAI_API_BASE}/audio/transcriptions`, {
    method: "POST",
    headers: {
      ...headers,
      // Don't set Content-Type, let fetch set it with boundary
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      `Whisper API error: ${error.error?.message || response.statusText}`
    );
  }

  const data = await response.json();

  return {
    text: data.text,
    language: data.language,
    duration: data.duration,
    segments: data.segments,
  };
}

/**
 * Transcribe audio from URL
 */
export async function transcribeAudioFromUrl(
  audioUrl: string,
  options?: {
    language?: string;
    prompt?: string;
  }
): Promise<TranscriptionResponse> {
  // Download audio file
  const response = await fetch(audioUrl);
  if (!response.ok) {
    throw new Error(`Failed to download audio: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(new Uint8Array(arrayBuffer));

  // Extract filename from URL
  const fileName = audioUrl.split("/").pop() || "audio.mp3";

  return transcribeAudio({
    audioFile: buffer,
    fileName,
    language: options?.language,
    prompt: options?.prompt,
  });
}

/**
 * Summarize transcription for activity log
 */
export async function summarizeTranscription(
  transcription: string
): Promise<string> {
  const { createChatCompletion } = await import("./openaiService");

  const response = await createChatCompletion({
    messages: [
      {
        role: "system",
        content:
          "You are a helpful assistant that summarizes voice memos and call recordings for carrier dispute cases. Create a concise summary highlighting key points, decisions, and action items.",
      },
      {
        role: "user",
        content: `Summarize this transcription:\n\n${transcription}`,
      },
    ],
    temperature: 0.3,
    max_tokens: 500,
  });

  return response.choices[0]?.message?.content || "";
}

/**
 * Extract action items from transcription
 */
export async function extractActionItems(
  transcription: string
): Promise<string[]> {
  const { createChatCompletion } = await import("./openaiService");

  const response = await createChatCompletion({
    messages: [
      {
        role: "system",
        content:
          "Extract action items from the transcription. Return a JSON array of strings, each representing a specific action item. If no action items, return empty array.",
      },
      {
        role: "user",
        content: transcription,
      },
    ],
    temperature: 0.3,
    max_tokens: 500,
    // response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content || "{}";
  try {
    const parsed = JSON.parse(content);
    return parsed.action_items || parsed.actions || [];
  } catch (e) {
    console.error("Failed to parse action items:", content);
    return [];
  }
}
