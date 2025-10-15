# Music Generation API Endpoint

This endpoint uses **Google's Lyria** model to generate music based on text prompts via the Vercel AI SDK.

## Endpoint

`POST /api/music`

## Model Information

- **Model**: Google Lyria
- **Type**: Text-to-Music Generation
- **Source**: Google Generative AI API
- **SDK**: @ai-sdk/google (Vercel AI SDK)

## Setup

This endpoint uses **Google Vertex AI** to access the Lyria model. You need to configure the following environment variables:

### Required Environment Variables

```bash
# Add to your .env.local file

# Your Google Cloud Project ID
GOOGLE_CLOUD_PROJECT_ID=your-project-id

# Optional: Specify the region (defaults to us-central1)
GOOGLE_CLOUD_LOCATION=us-central1
```

### Authentication

The endpoint uses the Google Auth Library which automatically handles authentication. You have two options:

#### Option 1: Service Account Key File (Recommended for Development)

1. Download your service account key file from Google Cloud Console
2. Add the path to your `.env.local`:

```bash
GOOGLE_APPLICATION_CREDENTIALS=/path/to/your-service-account-key.json
```

#### Option 2: Application Default Credentials

Run the following command to authenticate with gcloud:

```bash
# Install gcloud CLI (if not already installed)
# Visit: https://cloud.google.com/sdk/docs/install

# Authenticate with Application Default Credentials
gcloud auth application-default login
```

No additional environment variables are needed with this method.

### Quick Setup Script

You can use the provided setup script to configure everything automatically:

```bash
./src/app/api/music/setup-env.sh
```

This script will guide you through:
- Setting up your Google Cloud project
- Choosing your authentication method
- Configuring environment variables

## Request Body Parameters

### Required Parameters

- `prompt` (string): Text description of the music you want to generate
  - Example: "upbeat jazz music with saxophone"
  - Example: "calm ambient background music for a podcast"

### Optional Parameters

- `duration` (number): Duration of the generated music in seconds
  - Default: `30`
  - Range: 1-300 seconds
  
- `temperature` (number): Controls randomness and creativity in generation
  - Default: `1.0`
  - Range: 0-2
  - Lower values = more predictable output
  - Higher values = more creative/varied output
  
- `segment_id` (string): Optional unique identifier to use as the filename
  - If not provided, a random UUID will be generated

## Example Request

```bash
curl -X POST http://localhost:3000/api/music \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "upbeat electronic music with drums and synthesizers",
    "duration": 45,
    "temperature": 1.2,
    "segment_id": "my-music-001"
  }'
```

## Example Response

### Success Response (200)

```json
{
  "success": true,
  "filename": "my-music-001.mp3",
  "filepath": "/path/to/pirate-radio/temp_audio/my-music-001.mp3",
  "size": 1048576,
  "format": "mp3",
  "type": "music",
  "prompt": "upbeat electronic music with drums and synthesizers",
  "duration": 45,
  "temperature": 1.2,
  "model": "google-lyria",
  "segment_id": "my-music-001"
}
```

### Error Responses

#### 400 - Bad Request
```json
{
  "error": "Prompt is required"
}
```

```json
{
  "error": "Duration must be between 1 and 300 seconds"
}
```

#### 503 - Service Unavailable
```json
{
  "error": "Failed to authenticate with Google API",
  "details": "Invalid API key"
}
```

#### 500 - Internal Server Error
```json
{
  "error": "Failed to generate music",
  "details": "Error details here"
}
```

## Usage in JavaScript

```javascript
async function generateMusic(prompt, options = {}) {
  const response = await fetch('/api/music', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      duration: options.duration || 30,
      temperature: options.temperature || 1.0,
      segment_id: options.segment_id,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to generate music');
  }

  return await response.json();
}

// Example usage
try {
  const result = await generateMusic(
    "calm piano music for a rainy day",
    { duration: 60, temperature: 0.8, segment_id: "rainy-day-music" }
  );
  console.log('Music generated:', result.filename);
  console.log('File path:', result.filepath);
  console.log('Model used:', result.model);
} catch (error) {
  console.error('Error:', error.message);
}
```

## Notes

- Generated audio files are saved to the `temp_audio` directory
- The endpoint uses Google's Vertex AI API, so generation time may vary based on:
  - API availability
  - Request queue
  - Duration of the music
- Typical generation time: 10-30 seconds for a 30-second audio clip
- The audio format is always MP3
- Make sure you have a valid Google Cloud project with Vertex AI enabled
- Authentication is handled automatically by the Google Auth Library (no manual token refresh needed)
- The Lyria model must be available in your selected region
- The Lyria model is optimized for high-quality music generation with natural-sounding instruments and compositions

## Integration with Orchestration

This endpoint can be integrated into the podcast orchestration flow by calling it for music segments:

```javascript
// In your orchestration code
const musicSegments = pap.timeline.filter(seg => seg.type === 'music');

for (const segment of musicSegments) {
  const response = await fetch('/api/music', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: segment.content, // Music description from PAP
      duration: segment.duration,
      segment_id: segment.id,
    }),
  });
  
  const result = await response.json();
  // Use result.filepath for stitching
}
```


