# Music Generation API Endpoint

This endpoint uses the **ACE-Step/ACE-Step** model from Hugging Face Spaces to generate music based on text prompts.

## Endpoint

`POST /api/music`

## Model Information

- **Model**: ACE-Step/ACE-Step
- **Type**: Text-to-Music Generation
- **Source**: Hugging Face Spaces
- **Client**: @gradio/client

## Request Body Parameters

### Required Parameters

- `prompt` (string): Text description of the music you want to generate
  - Example: "upbeat jazz music with saxophone"
  - Example: "calm ambient background music for a podcast"

### Optional Parameters

- `duration` (number): Duration of the generated music in seconds
  - Default: `30`
  - Range: 1-300 seconds
  
- `steps` (number): Number of inference steps (higher = better quality but slower)
  - Default: `50`
  
- `cfg_scale` (number): Classifier-free guidance scale (controls how closely the model follows the prompt)
  - Default: `7.5`
  - Higher values = more adherence to prompt
  
- `segment_id` (string): Optional unique identifier to use as the filename
  - If not provided, a random UUID will be generated

## Example Request

```bash
curl -X POST http://localhost:3000/api/music \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "upbeat electronic music with drums and synthesizers",
    "duration": 45,
    "steps": 50,
    "cfg_scale": 7.5,
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
  "steps": 50,
  "cfg_scale": 7.5,
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
  "error": "Failed to connect to Hugging Face Space",
  "details": "Connection timeout"
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
      steps: options.steps || 50,
      cfg_scale: options.cfg_scale || 7.5,
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
    { duration: 60, segment_id: "rainy-day-music" }
  );
  console.log('Music generated:', result.filename);
  console.log('File path:', result.filepath);
} catch (error) {
  console.error('Error:', error.message);
}
```

## Notes

- Generated audio files are saved to the `temp_audio` directory
- The endpoint uses the Hugging Face Spaces API, so generation time may vary based on:
  - Model availability
  - Queue position
  - Number of inference steps
  - Duration of the music
- Typical generation time: 30-60 seconds for a 30-second audio clip
- The audio format is always MP3
- Make sure you have a stable internet connection as the model is hosted on Hugging Face Spaces

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

