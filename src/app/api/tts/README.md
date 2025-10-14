# OpenAI Text-to-Speech API Endpoint

This endpoint uses the Vercel AI SDK and OpenAI's TTS model to convert text to speech and saves the audio files on the server.

## Setup

1. Add your OpenAI API key to `.env`:
```bash
OPENAI_API_KEY=your_openai_api_key_here
```

Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)

## Endpoint

`POST /api/tts`

## Request Body

```json
{
  "text": "Hello, this is a test of OpenAI text to speech.",
  "voice": "alloy",
  "model": "tts-1",
  "speed": 1.0,
  "response_format": "mp3"
}
```

### Parameters

- **text** (required): The text to convert to speech (max 4096 characters)
- **voice** (optional): Voice to use. Options: `alloy`, `echo`, `fable`, `onyx`, `nova`, `shimmer`. Default: `alloy`
- **model** (optional): TTS model to use. Options:
  - `tts-1`: Standard quality (faster, cheaper)
  - `tts-1-hd`: High definition quality (slower, more expensive)
  Default: `tts-1`
- **speed** (optional): Speaking speed (0.25 to 4.0). Default: `1.0`
- **response_format** (optional): Audio format. Options: `mp3`, `opus`, `aac`, `flac`, `wav`, `pcm`. Default: `mp3`

## Response

Returns a JSON object with metadata about the saved audio file:

```json
{
  "success": true,
  "filename": "uuid.mp3",
  "filepath": "/absolute/path/to/temp_audio/uuid.mp3",
  "size": 12345,
  "format": "mp3",
  "voice": "alloy",
  "model": "tts-1"
}
```

The audio files are saved to the `temp_audio` directory in the project root. You can call this endpoint multiple times and then stitch the files together later.

## Usage Examples

### JavaScript Fetch

```javascript
const response = await fetch('/api/tts', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    text: 'Hello, world! This is OpenAI text to speech.',
    voice: 'nova',
    model: 'tts-1',
    speed: 1.0,
    response_format: 'mp3'
  })
});

const result = await response.json();
console.log('Audio file saved:', result.filename);
console.log('File path:', result.filepath);
console.log('File size:', result.size, 'bytes');

// You can now use the filename to reference this audio file
// for stitching multiple files together later
```

### Multiple Calls for Stitching

```javascript
const audioFiles = [];

// Generate multiple audio segments
for (const text of textSegments) {
  const response = await fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voice: 'nova' })
  });
  
  const result = await response.json();
  audioFiles.push(result.filename);
}

// Later, stitch these files together using ffmpeg or similar
console.log('Generated files:', audioFiles);
```

### cURL

```bash
curl -X POST http://localhost:3000/api/tts \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello, world!",
    "voice": "nova",
    "model": "tts-1"
  }'
```

### React Component Example

```tsx
'use client';

import { useState } from 'react';

export default function TextToSpeech() {
  const [text, setText] = useState('');
  const [voice, setVoice] = useState('alloy');
  const [loading, setLoading] = useState(false);
  const [audioFiles, setAudioFiles] = useState<string[]>([]);

  const generateSpeech = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate speech');
      }

      const result = await response.json();
      console.log('Audio file generated:', result.filename);
      setAudioFiles(prev => [...prev, result.filename]);
      alert(`Audio file saved: ${result.filename}`);
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to generate speech');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Enter text to convert to speech..."
      />
      <select value={voice} onChange={(e) => setVoice(e.target.value)}>
        <option value="alloy">Alloy</option>
        <option value="echo">Echo</option>
        <option value="fable">Fable</option>
        <option value="onyx">Onyx</option>
        <option value="nova">Nova</option>
        <option value="shimmer">Shimmer</option>
      </select>
      <button onClick={generateSpeech} disabled={loading || !text}>
        {loading ? 'Generating...' : 'Generate Speech'}
      </button>
      
      {audioFiles.length > 0 && (
        <div>
          <h3>Generated Files:</h3>
          <ul>
            {audioFiles.map((file, i) => (
              <li key={i}>{file}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

## Error Responses

- **400 Bad Request**: Missing or invalid parameters
- **401 Unauthorized**: Invalid OpenAI API key
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Server error or OpenAI API error

## Pricing

See [OpenAI TTS Pricing](https://openai.com/api/pricing/) for current rates.

## References

- [OpenAI TTS API Documentation](https://platform.openai.com/docs/api-reference/audio/createSpeech)
- [Vercel AI SDK](https://sdk.vercel.ai/)

