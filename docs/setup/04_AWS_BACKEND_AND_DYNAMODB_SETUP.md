# AWS Backend, Bedrock & DynamoDB Cloud Sync Setup ☁️⚡

## Overview

Pandivo TV uses Amazon Web Services (AWS) to provide cloud state persistence and generative intelligence:
1. **Amazon DynamoDB**: Single-table cloud state backup (`firetv_sync_state`) synchronizing avatar preferences, liked songs, and custom playlists across Fire TV devices.
2. **Amazon Bedrock (Amazon Nova Lite)**: Primary cloud AI engine providing low-latency natural language intent parsing, contextual song insights, and dynamic DJ commentary.
3. **AWS Lambda (Function URL)**: Zero-friction serverless gateway connecting the TV application to Bedrock and DynamoDB without embedding long-lived AWS IAM secret keys into the client APK.

---

## 1. Architecture Overview

```text
┌────────────────────────┐         HTTPS POST          ┌────────────────────────┐
│  Fire TV Client App    │ ──────────────────────────> │   AWS Lambda Gateway   │
│  (React Native / Expo) │                             │   (Node.js 20.x)       │
└────────────────────────┘                             └───────────┬────────────┘
            ▲                                                      │
            │                                                      ▼
            │ (Non-blocking                                ┌────────────────────┐
            │  SQLite fallback)                            │   Amazon Bedrock   │
            │                                              │   Nova Lite v1:0   │
            │                                              └────────────────────┘
            │                                                      │
            │                                                      ▼
            │                                              ┌────────────────────┐
            │                                              │  Amazon DynamoDB   │
            └───────────────────────────────────────────── │  firetv_sync_state │
                                                           └────────────────────┘
```

---

## 2. Amazon DynamoDB Table Provisioning

The cloud synchronization manager uses a single-table schema keyed by `userId`.

### Table Schema Specification:
- **Table Name**: `firetv_sync_state`
- **Partition Key (PK)**: `userId` (`String`)
- **Billing Mode**: On-Demand (`PAY_PER_REQUEST`)
- **Encryption**: AWS Managed KMS Key (`DEFAULT`)

### Provisioning via AWS CLI:
```bash
aws dynamodb create-table \
    --table-name firetv_sync_state \
    --attribute-definitions AttributeName=userId,AttributeType=S \
    --key-schema AttributeName=userId,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    --region us-east-1
```

### Item Schema Example:
```json
{
  "userId": "default_firetv_user",
  "profile": {
    "avatarId": "ember",
    "themeId": "sunset",
    "updatedAt": 1776281000000
  },
  "favorites": ["t1", "t3", "t7", "t12"],
  "playlists": [],
  "aiDjSessions": [],
  "lastSyncedAt": 1776281005000
}
```

---

## 3. Amazon Bedrock Configuration

Pandivo TV utilizes **Amazon Nova Lite (`amazon.nova-lite-v1:0`)** for lightning-fast TV inference (<800ms response time).

### Step 1: Request Model Access in AWS Console
1. Open the **Amazon Bedrock Console** in an enabled region (e.g. `us-east-1`).
2. In the left navigation, click **Model Access**.
3. Click **Modify Model Access**.
4. Check the box for **Amazon -> Nova Lite**.
5. Save changes. Model access is typically granted instantaneously.

---

## 4. Lambda Serverless Gateway Deployment

The Lambda function bridges client HTTP requests directly to Bedrock and DynamoDB.

### Step 1: Lambda IAM Role Policy
Attach an IAM policy granting Bedrock invocation and DynamoDB read/write access:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel"
      ],
      "Resource": "arn:aws:bedrock:*:*:model/amazon.nova-lite-v1:0"
    },
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem"
      ],
      "Resource": "arn:aws:dynamodb:*:*:table/firetv_sync_state"
    }
  ]
}
```

### Step 2: Configure Lambda Function URL
1. Create a Node.js 20.x Lambda function named `PandivoTvGateway`.
2. Enable **Function URL** with `Auth type: NONE` (public webhook) and configure CORS to allow methods `POST, GET, OPTIONS`.
3. Copy your Lambda Function URL: `https://<unique-id>.lambda-url.us-east-1.on.aws/`

---

## 5. Client Application Configuration

Add your Lambda Function URL to `FireTVMusicPOC/.env`:

```env
# AWS Bedrock & DynamoDB Cloud Sync Lambda Endpoint
EXPO_PUBLIC_AWS_LAMBDA_URL=https://<unique-id>.lambda-url.us-east-1.on.aws/
```

### Verification via Health Check:
Test the backend connectivity using `curl`:

```bash
curl -X POST https://<unique-id>.lambda-url.us-east-1.on.aws/ \
     -H "Content-Type: application/json" \
     -d '{"action": "health"}'
```

Expected JSON response:
```json
{
  "status": "online",
  "service": "Pandivo TV Bedrock Gateway",
  "defaultModel": "amazon.nova-lite-v1:0",
  "dynamoTable": "firetv_sync_state",
  "region": "us-east-1"
}
```

> [!NOTE]
> If `EXPO_PUBLIC_AWS_LAMBDA_URL` is omitted, Pandivo TV seamlessly falls back to Google Gemini Flash API, and if offline, to deterministic on-device local engines.
