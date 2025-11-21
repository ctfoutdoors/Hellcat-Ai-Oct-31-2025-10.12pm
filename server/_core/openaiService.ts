/**
 * Comprehensive OpenAI Service
 * Uses direct HTTP requests to avoid SDK issues
 * Supports all major OpenAI APIs
 */

import https from 'https';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_BASE_URL = 'api.openai.com';

interface RequestOptions {
  method: string;
  path: string;
  data?: any;
}

/**
 * Make authenticated request to OpenAI API
 */
async function makeOpenAIRequest<T = any>(options: RequestOptions): Promise<T> {
  const { method, path, data } = options;
  
  const body = data ? JSON.stringify(data) : undefined;
  
  const requestOptions = {
    hostname: OPENAI_BASE_URL,
    port: 443,
    path,
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      ...(body && { 'Content-Length': Buffer.byteLength(body) }),
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(requestOptions, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          
          if (res.statusCode && res.statusCode >= 400) {
            reject(new Error(`OpenAI API Error: ${parsed.error?.message || responseData}`));
          } else {
            resolve(parsed);
          }
        } catch (e) {
          reject(new Error(`Failed to parse OpenAI response: ${responseData}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (body) {
      req.write(body);
    }
    
    req.end();
  });
}

// ============================================================================
// 1. CHAT COMPLETIONS (GPT-4o, GPT-4, GPT-3.5)
// ============================================================================

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionRequest {
  model?: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: 'json_object' | 'text' };
  stream?: boolean;
}

export async function chatCompletion(request: ChatCompletionRequest) {
  const { model = 'gpt-4o', ...rest } = request;
  
  return makeOpenAIRequest({
    method: 'POST',
    path: '/v1/chat/completions',
    data: { model, ...rest },
  });
}

// ============================================================================
// 2. EMBEDDINGS (text-embedding-3-small, text-embedding-3-large)
// ============================================================================

export interface EmbeddingRequest {
  input: string | string[];
  model?: string;
}

export async function createEmbedding(request: EmbeddingRequest) {
  const { model = 'text-embedding-3-small', ...rest } = request;
  
  return makeOpenAIRequest({
    method: 'POST',
    path: '/v1/embeddings',
    data: { model, ...rest },
  });
}

// ============================================================================
// 3. IMAGE GENERATION (DALL-E 3, DALL-E 2)
// ============================================================================

export interface ImageGenerationRequest {
  prompt: string;
  model?: 'dall-e-3' | 'dall-e-2';
  size?: '1024x1024' | '1792x1024' | '1024x1792' | '256x256' | '512x512';
  quality?: 'standard' | 'hd';
  n?: number;
}

export async function generateImage(request: ImageGenerationRequest) {
  const { model = 'dall-e-3', size = '1024x1024', quality = 'standard', n = 1, ...rest } = request;
  
  return makeOpenAIRequest({
    method: 'POST',
    path: '/v1/images/generations',
    data: { model, size, quality, n, ...rest },
  });
}

// ============================================================================
// 4. AUDIO TRANSCRIPTION (Whisper)
// ============================================================================

export interface TranscriptionRequest {
  file: Buffer;
  filename: string;
  model?: string;
  language?: string;
  prompt?: string;
}

// Note: Whisper requires multipart/form-data, needs special handling
export async function transcribeAudio(request: TranscriptionRequest) {
  // This would require multipart form data handling
  // For now, use the existing voiceTranscription service
  throw new Error('Use server/_core/voiceTranscription.ts for audio transcription');
}

// ============================================================================
// 5. TEXT-TO-SPEECH (TTS)
// ============================================================================

export interface TTSRequest {
  input: string;
  model?: 'tts-1' | 'tts-1-hd';
  voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  speed?: number;
}

export async function textToSpeech(request: TTSRequest) {
  const { model = 'tts-1', voice = 'alloy', speed = 1.0, ...rest } = request;
  
  return makeOpenAIRequest({
    method: 'POST',
    path: '/v1/audio/speech',
    data: { model, voice, speed, ...rest },
  });
}

// ============================================================================
// 6. MODERATION
// ============================================================================

export interface ModerationRequest {
  input: string | string[];
  model?: string;
}

export async function moderateContent(request: ModerationRequest) {
  const { model = 'text-moderation-latest', ...rest } = request;
  
  return makeOpenAIRequest({
    method: 'POST',
    path: '/v1/moderations',
    data: { model, ...rest },
  });
}

// ============================================================================
// 7. FINE-TUNING
// ============================================================================

export interface FineTuneRequest {
  training_file: string;
  model?: string;
  hyperparameters?: {
    n_epochs?: number;
    batch_size?: number;
    learning_rate_multiplier?: number;
  };
}

export async function createFineTune(request: FineTuneRequest) {
  return makeOpenAIRequest({
    method: 'POST',
    path: '/v1/fine_tuning/jobs',
    data: request,
  });
}

export async function listFineTunes() {
  return makeOpenAIRequest({
    method: 'GET',
    path: '/v1/fine_tuning/jobs',
  });
}

// ============================================================================
// 8. ASSISTANTS API (Beta)
// ============================================================================

export interface AssistantRequest {
  model?: string;
  name?: string;
  description?: string;
  instructions?: string;
  tools?: Array<{ type: string }>;
}

export async function createAssistant(request: AssistantRequest) {
  const { model = 'gpt-4o', ...rest } = request;
  
  return makeOpenAIRequest({
    method: 'POST',
    path: '/v1/assistants',
    data: { model, ...rest },
  });
}

// ============================================================================
// 9. VISION (GPT-4 Vision)
// ============================================================================

export interface VisionMessage {
  role: 'system' | 'user' | 'assistant';
  content: Array<{
    type: 'text' | 'image_url';
    text?: string;
    image_url?: { url: string; detail?: 'low' | 'high' | 'auto' };
  }>;
}

export interface VisionRequest {
  model?: string;
  messages: VisionMessage[];
  max_tokens?: number;
}

export async function analyzeImage(request: VisionRequest) {
  const { model = 'gpt-4o', ...rest } = request;
  
  return makeOpenAIRequest({
    method: 'POST',
    path: '/v1/chat/completions',
    data: { model, ...rest },
  });
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Simple text completion
 */
export async function complete(prompt: string, options?: Partial<ChatCompletionRequest>): Promise<string> {
  const response = await chatCompletion({
    messages: [{ role: 'user', content: prompt }],
    ...options,
  });
  
  return response.choices[0].message.content;
}

/**
 * JSON completion with structured output
 */
export async function completeJSON<T = any>(prompt: string, options?: Partial<ChatCompletionRequest>): Promise<T> {
  const response = await chatCompletion({
    messages: [
      { role: 'system', content: 'You must respond with valid JSON only. No markdown, no explanations.' },
      { role: 'user', content: prompt },
    ],
    response_format: { type: 'json_object' },
    ...options,
  });
  
  return JSON.parse(response.choices[0].message.content);
}

/**
 * List all available models
 */
export async function listModels() {
  return makeOpenAIRequest({
    method: 'GET',
    path: '/v1/models',
  });
}
