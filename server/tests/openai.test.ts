import { describe, it, expect } from 'vitest';
import OpenAI from 'openai';

describe('OpenAI API Integration', () => {
  it('should validate API key and list available models', async () => {
    const apiKey = process.env.OPENAI_API_KEY;
    
    expect(apiKey).toBeDefined();
    expect(apiKey).toMatch(/^sk-/);
    
    const openai = new OpenAI({ apiKey });
    
    // Test 1: List available models
    const models = await openai.models.list();
    expect(models.data.length).toBeGreaterThan(0);
    
    const modelIds = models.data.map(m => m.id);
    console.log('\n✅ Available OpenAI Models:', modelIds.filter(id => id.includes('gpt')).slice(0, 10));
    
    // Test 2: Check for GPT-4o and GPT-5
    const hasGPT4o = modelIds.some(id => id.includes('gpt-4o'));
    const hasGPT5 = modelIds.some(id => id.includes('gpt-5') || id.includes('o1') || id.includes('o3'));
    
    console.log('GPT-4o available:', hasGPT4o);
    console.log('GPT-5/o1/o3 available:', hasGPT5);
    
    // Test 3: Make a simple completion request
    const completion = await openai.chat.completions.create({
      model: hasGPT5 ? 'o1' : (hasGPT4o ? 'gpt-4o' : 'gpt-4-turbo'),
      messages: [
        { role: 'user', content: 'Reply with exactly: "OpenAI API is active"' }
      ],
      max_tokens: 20,
    });
    
    const response = completion.choices[0].message.content;
    console.log('\n✅ OpenAI Response:', response);
    console.log('Model used:', completion.model);
    
    expect(response).toContain('OpenAI');
  }, 30000); // 30 second timeout
});
