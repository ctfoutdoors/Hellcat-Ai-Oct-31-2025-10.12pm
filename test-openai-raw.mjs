import https from 'https';

const apiKey = process.env.OPENAI_API_KEY;

console.log('Testing OpenAI API with raw HTTP request...\n');
console.log('API Key format:', apiKey?.substring(0, 15) + '...');
console.log('API Key length:', apiKey?.length);

const data = JSON.stringify({
  model: 'gpt-3.5-turbo',
  messages: [
    { role: 'user', content: 'Say "Hello from OpenAI"' }
  ],
  max_tokens: 20
});

const options = {
  hostname: 'api.openai.com',
  port: 443,
  path: '/v1/chat/completions',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
    'Content-Length': data.length
  }
};

const req = https.request(options, (res) => {
  console.log('\n📡 Response Status:', res.statusCode);
  console.log('Response Headers:', JSON.stringify(res.headers, null, 2));
  
  let responseData = '';
  
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    console.log('\n📄 Response Body:');
    try {
      const parsed = JSON.parse(responseData);
      console.log(JSON.stringify(parsed, null, 2));
      
      if (parsed.choices && parsed.choices[0]) {
        console.log('\n✅ SUCCESS! OpenAI Response:', parsed.choices[0].message.content);
      } else if (parsed.error) {
        console.log('\n❌ ERROR:', parsed.error.message);
      }
    } catch (e) {
      console.log(responseData);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request Error:', error);
});

req.write(data);
req.end();
