import { describe, it, expect } from 'vitest';
import { invokeOpenAI, invokeOpenAIText, invokeOpenAIJSON } from '../_core/openai';

describe('OpenAI Service', () => {
  it('should successfully call OpenAI with text response', async () => {
    const response = await invokeOpenAIText({
      messages: [
        { role: 'user', content: 'Say exactly: "OpenAI service is working"' }
      ],
      model: 'gpt-3.5-turbo', // Use cheaper model for testing
      max_tokens: 20,
    });
    
    console.log('\n✅ OpenAI Response:', response);
    expect(response).toContain('OpenAI');
  }, 30000);

  it('should successfully call OpenAI with JSON response', async () => {
    const response = await invokeOpenAIJSON<{ status: string; message: string }>({
      messages: [
        { 
          role: 'system', 
          content: 'You must respond with valid JSON only. No markdown, no explanations.' 
        },
        { 
          role: 'user', 
          content: 'Return JSON with fields: status="success", message="OpenAI JSON working"' 
        }
      ],
      model: 'gpt-3.5-turbo',
      max_tokens: 50,
    });
    
    console.log('\n✅ OpenAI JSON Response:', response);
    expect(response.status).toBe('success');
    expect(response.message).toContain('OpenAI');
  }, 30000);
});
