# Testing the Music Generation Endpoint

## Quick Start

### 1. Setup Environment (One-time setup)

Run the setup script to configure your Google Cloud credentials:

```bash
./src/app/api/music/setup-env.sh
```

This will:
- Check if `gcloud` CLI is installed
- Get your Google Cloud project ID
- Generate an access token
- Update your `.env.local` file

### 2. Start Dev Server

```bash
yarn dev
```

### 3. Test the Endpoint

#### Option A: Use the test script
```bash
./src/app/api/music/test-music-endpoint.sh
```

#### Option B: Manual curl command
```bash
curl -X POST http://localhost:3000/api/music \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "upbeat jazz music with saxophone and piano",
    "duration": 15,
    "temperature": 1.0,
    "segment_id": "test-jazz"
  }'
```

## Expected Responses

### Success ✅
```json
{
  "success": true,
  "filename": "test-jazz.mp3",
  "filepath": "/path/to/pirate-radio/temp_audio/test-jazz.mp3",
  "size": 245760,
  "format": "mp3",
  "type": "music",
  "prompt": "upbeat jazz music with saxophone and piano",
  "duration": 15,
  "temperature": 1.0,
  "model": "google-lyria",
  "segment_id": "test-jazz"
}
```

### Error: Missing Project ID ❌
```json
{
  "error": "GOOGLE_CLOUD_PROJECT_ID not configured"
}
```
**Fix:** Run the setup script or manually set `GOOGLE_CLOUD_PROJECT_ID` in `.env.local`

### Error: Missing Access Token ❌
```json
{
  "error": "GOOGLE_CLOUD_ACCESS_TOKEN or GOOGLE_SERVICE_ACCOUNT_KEY not configured",
  "details": "Run: gcloud auth print-access-token, or provide service account JSON"
}
```
**Fix:** Run the setup script or get a fresh token:
```bash
export GOOGLE_CLOUD_ACCESS_TOKEN=$(gcloud auth print-access-token)
```

### Error: Authentication Failed (401/403) ❌
```json
{
  "error": "Failed to authenticate with Vertex AI",
  "details": "Vertex AI error: 401 - ...",
  "hint": "Make sure GOOGLE_CLOUD_ACCESS_TOKEN is set. Get it via: gcloud auth print-access-token"
}
```
**Fix:** Your token may have expired (tokens last 1 hour). Run:
```bash
./src/app/api/music/setup-env.sh
```

### Error: Model Not Found (404) ❌
```json
{
  "error": "Vertex AI Lyria model not found",
  "details": "Vertex AI error: 404 - ...",
  "hint": "Verify the model name (lyria-002) and that it's available in your project region"
}
```
**Fix:** 
- Ensure Vertex AI is enabled in your project
- Verify the Lyria model is available in your region (`us-central1`)
- Check if you need to request access to the Lyria model

## Troubleshooting

### Token Expired
Access tokens expire after 1 hour. Refresh by running:
```bash
./src/app/api/music/setup-env.sh
```

### gcloud Not Installed
Install the Google Cloud CLI:
- macOS: `brew install google-cloud-sdk`
- Or visit: https://cloud.google.com/sdk/docs/install

### Not Authenticated
Run:
```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

### Vertex AI Not Enabled
Enable Vertex AI in your Google Cloud project:
```bash
gcloud services enable aiplatform.googleapis.com
```

## Testing Different Prompts

Try various music styles:

```bash
# Classical music
curl -X POST http://localhost:3000/api/music \
  -H "Content-Type: application/json" \
  -d '{"prompt": "A gentle classical piano piece with strings"}'

# Electronic
curl -X POST http://localhost:3000/api/music \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Upbeat electronic dance music with synthesizers"}'

# Ambient
curl -X POST http://localhost:3000/api/music \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Calm ambient background music for a podcast"}'

# Jazz
curl -X POST http://localhost:3000/api/music \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Smooth jazz with saxophone and double bass"}'
```

## Checking Generated Files

After successful generation, check the `temp_audio` directory:

```bash
ls -lh temp_audio/
```

Play the generated audio:
```bash
# macOS
afplay temp_audio/test-jazz.mp3

# Linux
mpg123 temp_audio/test-jazz.mp3
```

