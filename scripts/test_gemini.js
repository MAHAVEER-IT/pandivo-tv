const https = require('https');

const apiKey = process.env.GEMINI_API_KEY || process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

const payload = JSON.stringify({
  contents: [
    {
      parts: [
        {
          text: 'Respond strictly in JSON with {"status": "ok", "message": "Gemini connection verified"}'
        }
      ]
    }
  ],
  generationConfig: {
    responseMimeType: 'application/json'
  }
});

const req = https.request(
  {
    hostname: 'generativelanguage.googleapis.com',
    path: `/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    }
  },
  (res) => {
    let data = '';
    res.on('data', (chunk) => (data += chunk));
    res.on('end', () => {
      console.log('HTTP Status:', res.statusCode);
      console.log('Response Body:', data);
    });
  }
);

req.on('error', (err) => console.error('Request error:', err));
req.write(payload);
req.end();
