import { invokeLLM } from './server/_core/llm.ts';

console.log('Testing LLM availability...\n');

try {
  const response = await invokeLLM({
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Reply with exactly: "LLM is active and operational"' }
    ]
  });

  console.log('✅ LLM Response:');
  console.log(response.choices[0].message.content);
  console.log('\n✅ OpenAI/LLM is ACTIVE and working correctly!');
  console.log('\nModel used:', response.model);
  console.log('Total tokens:', response.usage.total_tokens);
} catch (error) {
  console.error('❌ LLM Test Failed:', error.message);
  process.exit(1);
}
