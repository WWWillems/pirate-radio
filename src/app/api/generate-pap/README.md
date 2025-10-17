# Generate PAP (Podcast Assembly Plan) API

This endpoint generates a structured podcast assembly plan using AI with contextual tool support.

## Endpoint

`POST /api/generate-pap`

## Features

- **Structured Output**: Returns a complete podcast assembly plan with segments
- **Tool Support**: Automatically gathers contextual information like date/time and weather
- **Streaming**: Uses streaming responses for better UX
- **Configurable**: Supports multiple models and temperature settings

## Request Body

```json
{
  "prompt": "Create a morning podcast about coffee",
  "model": "gpt-5",
  "temperature": 0.7,
  "system": "Optional custom system prompt",
  "includeDateTime": true,
  "includeWeather": false,
  "weatherLocation": "Halifax, Nova Scotia",
  "timezone": "America/Halifax"
}
```

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `prompt` | string | **required** | The prompt for generating the podcast plan |
| `model` | string | `"gpt-5-2025-08-07"` | Model to use (`"gpt-5"` or `"gpt-4o-mini"`) |
| `temperature` | number | `0.7` | Creativity level (0.0 to 2.0) |
| `system` | string | Auto-generated | Custom system prompt (optional) |
| `includeDateTime` | boolean | `true` | Include current date/time context |
| `includeWeather` | boolean | `false` | Include weather context |
| `weatherLocation` | string | - | Location for weather (required if `includeWeather` is true) |
| `timezone` | string | System default | Timezone for date/time (e.g., `"America/New_York"`) |

## Tools

### 1. Current Date & Time Tool

Automatically provides:
- Current date and time
- Day of week
- Timestamp
- Timezone information

**Configuration:**
- Set `includeDateTime: false` to disable
- Set `timezone` to specify a timezone

### 2. Weather Tool

Provides weather information for a specific location.

**Configuration:**
- Set `includeWeather: true` to enable
- Set `weatherLocation` to specify the location

**Setup:**
To use real weather data, you need to:

1. Get an API key from a weather service (e.g., [OpenWeatherMap](https://openweathermap.org/api))
2. Add it to your `.env.local`:
   ```bash
   WEATHER_API_KEY=your_api_key_here
   ```
3. Uncomment the weather API code in `route.ts` (lines 48-70)

## Example Usage

### Basic Request (with date/time only)

```bash
curl -X POST http://localhost:3000/api/generate-pap \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Create a morning podcast about technology trends"
  }'
```

### Request with Weather

```bash
curl -X POST http://localhost:3000/api/generate-pap \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Create a morning weather podcast",
    "includeWeather": true,
    "weatherLocation": "Halifax, Nova Scotia",
    "timezone": "America/Halifax"
  }'
```

### Request without Context Tools

```bash
curl -X POST http://localhost:3000/api/generate-pap \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Create a podcast about classic cars",
    "includeDateTime": false
  }'
```

## Response Format

The endpoint streams a structured response that conforms to the `podcastAssemblyPlanSchema`. The response includes:

```typescript
{
  episode_id: string;
  title: string;
  description: string;
  segments: Array<{
    order: number;
    type: "intro" | "content" | "transition" | "outro";
    content: string;
    duration_seconds: number;
    voice: string;
    metadata?: Record<string, any>;
  }>;
}
```

## Adding More Tools

To add additional tools:

1. **Create a tool function:**

```typescript
async function getNewsHeadlines(topic: string) {
  // Fetch news from API
  const response = await fetch(`https://newsapi.org/...`);
  const data = await response.json();
  return data;
}
```

2. **Add tool option to request body interface:**

```typescript
const {
  // ... existing parameters
  includeNews = false,
  newsTopic,
} = body;
```

3. **Update `gatherToolContext` function:**

```typescript
if (options.includeNews && options.newsTopic) {
  context.news = await getNewsHeadlines(options.newsTopic);
}
```

4. **Update `formatToolContext` function:**

```typescript
if (context.news) {
  formatted += `\nTop News Headlines about ${context.news.topic}:\n`;
  for (const headline of context.news.headlines) {
    formatted += `  - ${headline}\n`;
  }
}
```

## Error Handling

The endpoint returns appropriate HTTP status codes:

- `400`: Invalid request (missing required parameters)
- `401`: Invalid OpenAI API key
- `429`: Rate limit exceeded
- `500`: Server error

## Notes

- The endpoint has a maximum duration of 30 seconds
- Tool context is gathered before the main generation and injected into the prompt
- This approach is compatible with `streamObject` which doesn't support dynamic tool calling
- For dynamic tool calling during generation, consider using `streamText` with a different approach

