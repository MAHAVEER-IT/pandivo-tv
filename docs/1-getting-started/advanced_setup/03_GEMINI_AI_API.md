# Google Gemini AI API Configuration 🤖🔑

## Overview

Pandivo TV uses **Google Gemini (Gemini 3.5 Flash / Flash Lite)** as its secondary cloud generative AI engine. When active, Gemini processes natural language music requests (e.g. *"Play upbeat 90s rock for a workout"*), analyzes sonic attributes, and extracts rich song stories for the 10-foot television display.

---

## 1. Obtaining a Gemini API Key

1. Navigate to **Google AI Studio**: [https://aistudio.google.com/](https://aistudio.google.com/)
2. Sign in with your Google account.
3. Click **Get API key** in the left sidebar.
4. Click **Create API key in new project** (or select an existing Google Cloud project).
5. Copy your newly generated API key string (`AIzaSy...`).

---

## 2. Setting Environment Variables

Pandivo TV uses Expo's public environment variable system (`EXPO_PUBLIC_*`), which automatically bakes the variable into the React Native client bundle.

Open `FireTVMusicPOC/.env` and assign your key:

```env
# Google Gemini API Key
EXPO_PUBLIC_GEMINI_API_KEY=AIzaSyYourGeneratedGeminiKeyHere
```

> [!CAUTION]
> Never commit your real API key to a public GitHub repository. Ensure `.env` is listed in `FireTVMusicPOC/.gitignore`. A template file [`.env.example`](../../../.env.example) is provided for version control.

---

## 3. Testing Gemini Connectivity

Pandivo TV includes a standalone Node.js diagnostic script to verify your key and network connectivity before launching the Android build.

Run the test script from the `FireTVMusicPOC` directory:

```bash
node scripts/test_gemini.js
```

### Expected Output:
```text
HTTP Status: 200
Response Body: {
  "candidates": [
    {
      "content": {
        "parts": [
          {
            "text": "{\n  \"message\": \"Gemini connection verified\",\n  \"status\": \"ok\"\n}"
          }
        ],
        "role": "model"
      },
      "finishReason": "STOP"
    }
  ]
}
```

---

## 4. Multi-Tiered AI Failover & Quota Protection

Pandivo TV is built with living-room durability guarantees. The AI pipeline follows this hierarchy:

```text
[Spoken Voice Command]
          │
          ▼
1. Amazon Bedrock (Nova Lite) ──(Failure or no URL)──> 2. Google Gemini (Flash)
                                                                 │
                                                      (HTTP 429 Quota / Offline)
                                                                 │
                                                                 ▼
                                                  3. On-Device Local Keyword Engine
```

### Supported Failover Scenarios:
- **HTTP 429 (Resource Exhausted / Rate Limit)**: The client catches the 429 status code and routes through `parseLocalIntent()` without interrupting playback.
- **HTTP 503 (Model Overloaded)**: Transparently falls back to local recommendation scoring.
- **Network Disconnect (Airplane Mode / No Wi-Fi)**: Operates 100% offline using deterministic rule sets and bundled local song metadata.
