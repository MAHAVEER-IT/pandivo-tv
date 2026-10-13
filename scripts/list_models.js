const https = require('https');

const apiKey = process.env.GEMINI_API_KEY || process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

https.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    try {
      const json = JSON.parse(data);
      if (json.models) {
        console.log('Available models:');
        json.models.forEach(m => console.log(' - ' + m.name + ' (' + m.supportedGenerationMethods.join(', ') + ')'));
      } else {
        console.log('No models returned. Response:', data);
      }
    } catch(e) {
      console.log('Raw:', data);
    }
  });
}).on('error', console.error);
