# Text Generation API Endpoint

This endpoint generates text using OpenAI models through the Vercel AI SDK.

## Endpoint

`POST /api/generate`

## Request Body

```json
{
  "prompt": "Write a short story about a pirate",
  "model": "gpt-4o-mini",
  "temperature": 0.7,
  "maxTokens": 1000,
  "system": "You are a helpful assistant" // optional
}
```

### Parameters

- `prompt` (required): The text prompt to generate from
- `model` (optional): OpenAI model to use. Default: `gpt-4o-mini`
  - Available models: `gpt-4o-mini`, `gpt-4o`, `gpt-4-turbo`, `gpt-3.5-turbo`
- `temperature` (optional): Controls randomness (0-2). Default: `0.7`
  - Lower values = more focused and deterministic
  - Higher values = more creative and random
- `maxTokens` (optional): Maximum tokens to generate. Default: `1000`
- `system` (optional): System message to set the assistant's behavior

## Response

The endpoint returns a streaming text response using the Vercel AI SDK's streaming format.

## Demo

Visit `/api/generate/page.tsx` for an interactive demo of the text generation endpoint.

## Example Usage

### Using fetch with streaming

```javascript
const response = await fetch('/api/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    prompt: 'Write a haiku about coding',
    model: 'gpt-4o-mini',
    temperature: 0.7,
  }),
});

// Handle streaming response
const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  const lines = chunk.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('0:')) {
      const text = line.substring(2);
      console.log(text);
    }
  }
}
```

### Using the Vercel AI SDK on the client

```javascript
import { useChat } from 'ai/react';

function ChatComponent() {
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: '/api/generate',
  });

  return (
    <div>
      {messages.map(m => (
        <div key={m.id}>{m.content}</div>
      ))}
      <form onSubmit={handleSubmit}>
        <input value={input} onChange={handleInputChange} />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}
```

## Environment Variables

Make sure to set your OpenAI API key in `.env.local`:

```
OPENAI_API_KEY=sk-...
```

