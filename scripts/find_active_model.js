const https = require('https');

const apiKey = process.env.GEMINI_API_KEY || process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

const modelsToTest = [
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-2.5-flash-lite',
  'gemini-pro-latest',
  'gemma-4-31b-it',
  'gemini-3.7-flash',
  'gemini-3.8-flash'
];

const payload = JSON.stringify({
  contents: [{ parts: [{ text: 'Respond with JSON: {"status": "ok"}' }] }],
  generationConfig: { responseMimeType: 'application/json' }
});

for (const model of modelsToTest) {
  const req = https.request({
    hostname: 'generativelanguage.googleapis.com',
    path: `/v1beta/models/${model}:generateContent?key=${apiKey}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    }
  }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log(`[${model}] Status:`, res.statusCode);
      if (res.statusCode === 200) {
        console.log(`>>> SUCCESS on ${model}! Body:`, data);
      }
    });
  });
  req.on('error', (err) => console.error(`[${model}] Error:`, err.message));
  req.write(payload);
  req.end();
}
