import OpenAI from 'openai';

// Initialize OpenAI client with API key from environment
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionOptions {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: 'json_object' } | { type: 'text' };
}

/**
 * Invoke OpenAI chat completion
 * Uses GPT-4o by default for best quality
 * Falls back to GPT-4-turbo if GPT-4o unavailable
 */
export async function invokeOpenAI(options: ChatCompletionOptions) {
  const {
    messages,
    model = 'gpt-4o', // Use GPT-4o by default
    temperature = 0.7,
    max_tokens,
    response_format,
  } = options;

  try {
    const completion = await openai.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens,
      ...(response_format && { response_format }),
    });

    return completion;
  } catch (error: any) {
    // If GPT-4o fails, try GPT-4-turbo
    if (model === 'gpt-4o' && error.status === 404) {
      console.log('GPT-4o not available, falling back to GPT-4-turbo');
      return openai.chat.completions.create({
        model: 'gpt-4-turbo',
        messages,
        temperature,
        max_tokens,
        ...(response_format && { response_format }),
      });
    }
    throw error;
  }
}

/**
 * Invoke OpenAI with structured JSON response
 */
export async function invokeOpenAIJSON<T = any>(
  options: Omit<ChatCompletionOptions, 'response_format'>
): Promise<T> {
  const completion = await invokeOpenAI({
    ...options,
    response_format: { type: 'json_object' },
  });

  const content = completion.choices[0].message.content;
  if (!content) {
    throw new Error('No content in OpenAI response');
  }

  return JSON.parse(content);
}

/**
 * Get simple text response from OpenAI
 */
export async function invokeOpenAIText(
  options: ChatCompletionOptions
): Promise<string> {
  const completion = await invokeOpenAI(options);
  return completion.choices[0].message.content || '';
}

export { openai };
