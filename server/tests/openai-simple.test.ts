import { describe, it, expect } from 'vitest';
import OpenAI from 'openai';

describe('OpenAI Chat Completion Test', () => {
  it('should successfully make a chat completion request', async () => {
    const apiKey = process.env.OPENAI_API_KEY;
    
    expect(apiKey).toBeDefined();
    console.log('\n🔑 API Key format:', apiKey?.substring(0, 10) + '...');
    
    const openai = new OpenAI({ apiKey });
    
    // Try GPT-4o first, fallback to GPT-4-turbo, then GPT-3.5-turbo
    const modelsToTry = ['gpt-4o', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'];
    
    let success = false;
    let workingModel = '';
    let response = '';
    
    for (const model of modelsToTry) {
      try {
        console.log(`\n🧪 Testing model: ${model}...`);
        
        const completion = await openai.chat.completions.create({
          model,
          messages: [
            { role: 'user', content: 'Reply with exactly: "OpenAI is working"' }
          ],
          max_tokens: 20,
        });
        
        response = completion.choices[0].message.content || '';
        workingModel = completion.model;
        success = true;
        
        console.log(`✅ SUCCESS with ${workingModel}`);
        console.log(`Response: ${response}`);
        break;
      } catch (error: any) {
        console.log(`❌ Failed with ${model}:`, error.message);
      }
    }
    
    expect(success).toBe(true);
    expect(response).toContain('OpenAI');
    console.log(`\n✅ OpenAI API is ACTIVE using model: ${workingModel}`);
  }, 60000); // 60 second timeout
});
