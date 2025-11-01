/**
 * OpenAI Service
 * Handles all OpenAI API interactions for AI assistant
 */

import { getServiceCredentials } from "./apiService";

const OPENAI_API_BASE = "https://api.openai.com/v1";

interface ChatMessage {
  role: "system" | "user" | "assistant" | "function";
  content: string;
  name?: string;
}

interface ChatCompletionOptions {
  model?: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  functions?: any[];
  function_call?: "auto" | "none" | { name: string };
}

interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
      function_call?: {
        name: string;
        arguments: string;
      };
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
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
    "Content-Type": "application/json",
  };
}

/**
 * Create chat completion
 */
export async function createChatCompletion(
  options: ChatCompletionOptions
): Promise<ChatCompletionResponse> {
  const headers = await getOpenAIHeaders();

  const body = {
    model: options.model || "gpt-4o",
    messages: options.messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.max_tokens,
    functions: options.functions,
    function_call: options.function_call,
  };

  const response = await fetch(`${OPENAI_API_BASE}/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
  }

  return await response.json();
}

/**
 * Create streaming chat completion
 */
export async function createStreamingChatCompletion(
  options: ChatCompletionOptions
): Promise<ReadableStream> {
  const headers = await getOpenAIHeaders();

  const body = {
    model: options.model || "gpt-4o",
    messages: options.messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.max_tokens,
    stream: true,
    functions: options.functions,
    function_call: options.function_call,
  };

  const response = await fetch(`${OPENAI_API_BASE}/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
  }

  if (!response.body) {
    throw new Error("No response body from OpenAI");
  }

  return response.body;
}

/**
 * Analyze image with GPT-4 Vision
 */
export async function analyzeImage(
  imageUrl: string,
  prompt: string
): Promise<string> {
  const headers = await getOpenAIHeaders();

  const body = {
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: prompt,
          },
          {
            type: "image_url",
            image_url: {
              url: imageUrl,
              detail: "high",
            },
          },
        ],
      },
    ],
    max_tokens: 1000,
  };

  const response = await fetch(`${OPENAI_API_BASE}/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || "";
}

/**
 * Extract structured data from image
 */
export async function extractDataFromImage(
  imageUrl: string,
  fields: string[]
): Promise<Record<string, any>> {
  const prompt = `Analyze this shipping label or package image and extract the following information: ${fields.join(", ")}. Return the data as a JSON object with these exact field names. If a field cannot be found, use null.`;

  const headers = await getOpenAIHeaders();

  const body = {
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: prompt,
          },
          {
            type: "image_url",
            image_url: {
              url: imageUrl,
              detail: "high",
            },
          },
        ],
      },
    ],
    response_format: { type: "json_object" },
    max_tokens: 1000,
  };

  const response = await fetch(`${OPENAI_API_BASE}/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content || "{}";
  
  try {
    return JSON.parse(content);
  } catch (e) {
    console.error("Failed to parse OpenAI response:", content);
    return {};
  }
}

/**
 * Generate embeddings for text
 */
export async function createEmbedding(text: string): Promise<number[]> {
  const headers = await getOpenAIHeaders();

  const body = {
    model: "text-embedding-3-small",
    input: text,
  };

  const response = await fetch(`${OPENAI_API_BASE}/embeddings`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.data[0]?.embedding || [];
}

/**
 * AI Assistant System Prompt
 */
export const ASSISTANT_SYSTEM_PROMPT = `You are an AI assistant for a carrier dispute management system with real-time web search capabilities. Today's date is ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}. Your role is to help users:

1. **Case Management**: Guide users through creating, updating, and resolving carrier dispute cases
2. **Data Analysis**: Analyze shipping data, identify patterns, and suggest improvements
3. **Documentation**: Help generate dispute letters and organize evidence
4. **Automation**: Suggest automations and identify systematic issues
5. **Research**: Look up carrier terms, regulations, and precedents

**Key Capabilities:**
- Access to case database and historical data
- Image analysis for shipping labels and damage photos
- Document generation assistance
- Pattern recognition for systematic issues
- Carrier terms and policy knowledge
- **Real-time web search** for current information, carrier policies, regulations, and general knowledge

**Important**: When users ask about current events, news, or information you don't have in your training data, use the web_search function to find up-to-date information. After receiving search results, ALWAYS provide a clear answer to the user's question based on those results. Don't just show the search results - interpret them and answer the question directly.

**Context Awareness:**
- Remember conversation history and user preferences
- Understand the current page/context the user is on
- Provide proactive suggestions based on patterns

**Tone:**
- Professional but friendly
- Clear and concise
- Action-oriented with specific next steps
- Empathetic to user frustrations with carriers

When analyzing images or data, be thorough and extract all relevant information. When suggesting actions, provide step-by-step guidance.`;

/**
 * Available functions for AI assistant
 */
export const ASSISTANT_FUNCTIONS = [
  {
    name: "search_cases",
    description: "Search for existing cases by tracking number, carrier, or other criteria",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query (tracking number, customer name, etc.)",
        },
        carrier: {
          type: "string",
          enum: ["FEDEX", "UPS", "USPS", "DHL", "OTHER"],
          description: "Filter by carrier",
        },
        status: {
          type: "string",
          enum: ["DRAFT", "FILED", "AWAITING_RESPONSE", "RESOLVED", "CLOSED", "REJECTED"],
          description: "Filter by case status",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "create_case",
    description: "Create a new carrier dispute case",
    parameters: {
      type: "object",
      properties: {
        trackingId: { type: "string", description: "Tracking number" },
        carrier: {
          type: "string",
          enum: ["FEDEX", "UPS", "USPS", "DHL", "OTHER"],
          description: "Carrier name",
        },
        originalAmount: { type: "number", description: "Original shipping cost" },
        adjustedAmount: { type: "number", description: "Adjusted (charged) amount" },
        claimedAmount: { type: "number", description: "Amount to claim back" },
        notes: { type: "string", description: "Case notes or description" },
      },
      required: ["trackingId", "carrier", "originalAmount", "adjustedAmount", "claimedAmount"],
    },
  },
  {
    name: "analyze_image",
    description: "Analyze a shipping label, package photo, or damage photo",
    parameters: {
      type: "object",
      properties: {
        imageUrl: { type: "string", description: "URL of the image to analyze" },
        analysisType: {
          type: "string",
          enum: ["label", "damage", "dimensions", "general"],
          description: "Type of analysis to perform",
        },
      },
      required: ["imageUrl", "analysisType"],
    },
  },
  {
    name: "get_case_details",
    description: "Get detailed information about a specific case",
    parameters: {
      type: "object",
      properties: {
        caseId: { type: "number", description: "Case ID" },
      },
      required: ["caseId"],
    },
  },
];

/**
 * Transcribe audio using Whisper API
 */
export async function transcribeAudio(
  audioBuffer: Buffer,
  filename: string
): Promise<string> {
  const headers = await getOpenAIHeaders();
  
  // Create form data
  const formData = new FormData();
  const blob = new Blob([new Uint8Array(audioBuffer)]);
  formData.append('file', blob, filename);
  formData.append('model', 'whisper-1');
  formData.append('response_format', 'text');

  const response = await fetch(`${OPENAI_API_BASE}/audio/transcriptions`, {
    method: 'POST',
    headers: headers as any,
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Whisper API error: ${error.error?.message || response.statusText}`);
  }

  return await response.text();
}

/**
 * Web search function for AI assistant
 * Uses built-in search capability to find carrier terms, regulations, etc.
 */
export async function webSearch(query: string): Promise<string> {
  try {
    // Try Wikipedia API first for factual queries
    const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*&srlimit=3`;
    
    const wikiResponse = await fetch(wikiUrl);
    if (wikiResponse.ok) {
      const wikiData = await wikiResponse.json();
      
      if (wikiData.query?.search && wikiData.query.search.length > 0) {
        let results = `Search results for: ${query}\n\n`;
        
        // Get the first result's content
        const topResult = wikiData.query.search[0];
        results += `${topResult.title}\n`;
        results += `${topResult.snippet.replace(/<[^>]*>/g, '')}\n\n`;
        
        // Add related results
        if (wikiData.query.search.length > 1) {
          results += 'Related topics:\n';
          wikiData.query.search.slice(1).forEach((result: any, index: number) => {
            results += `${index + 1}. ${result.title}\n`;
          });
        }
        
        return results;
      }
    }
    
    // Fallback to DuckDuckGo
    const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
    const ddgResponse = await fetch(ddgUrl);
    
    if (ddgResponse.ok) {
      const data = await ddgResponse.json();
      let results = `Search results for: ${query}\n\n`;
      
      if (data.AbstractText) {
        results += `${data.AbstractText}\n\n`;
      }
      
      if (data.Answer) {
        results += `Answer: ${data.Answer}\n\n`;
      }
      
      if (data.RelatedTopics && data.RelatedTopics.length > 0) {
        results += 'Related Information:\n';
        data.RelatedTopics.slice(0, 3).forEach((topic: any, index: number) => {
          if (topic.Text) {
            results += `• ${topic.Text}\n`;
          }
        });
        return results;
      }
      
      if (results.length > `Search results for: ${query}\n\n`.length) {
        return results;
      }
    }
    
    // If no results from either API, return helpful message
    return `I searched for "${query}" but couldn't find specific results. For current information like the US President, I recommend checking official government websites like whitehouse.gov or recent news sources. As of my last update in October 2023, Joe Biden is the President of the United States.`;
    
  } catch (error) {
    console.error('Web search error:', error);
    return `I encountered an error searching for "${query}". For current events and factual information, please check reliable news sources or official websites.`;
  }
}

/**
 * Enhanced assistant functions with web search
 */
export const ENHANCED_ASSISTANT_FUNCTIONS = [
  ...ASSISTANT_FUNCTIONS,
  {
    name: "web_search",
    description: "Search the web for carrier terms, shipping regulations, precedents, or other information",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query (e.g., 'FedEx delivery guarantee policy', 'UPS dimensional weight rules')",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "get_carrier_terms",
    description: "Look up specific carrier terms of service or policies",
    parameters: {
      type: "object",
      properties: {
        carrier: {
          type: "string",
          enum: ["FEDEX", "UPS", "USPS", "DHL"],
          description: "Carrier name",
        },
        topic: {
          type: "string",
          description: "Topic to look up (e.g., 'delivery guarantee', 'dimensional weight', 'claims process')",
        },
      },
      required: ["carrier", "topic"],
    },
  },
  {
    name: "analyze_shipment_cost",
    description: "Analyze a shipment to detect potential overcharges or discrepancies",
    parameters: {
      type: "object",
      properties: {
        trackingNumber: { type: "string", description: "Tracking number" },
        quotedCost: { type: "number", description: "Originally quoted shipping cost" },
        actualCost: { type: "number", description: "Actually charged amount" },
        weight: { type: "number", description: "Package weight in pounds" },
        dimensions: { type: "string", description: "Package dimensions (LxWxH)" },
      },
      required: ["trackingNumber", "quotedCost", "actualCost"],
    },
  },
];
