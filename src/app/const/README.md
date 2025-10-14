# Podcast Assembly Plan (PAP) Schema

This directory contains the Zod schema definition and TypeScript types for the Podcast Assembly Plan (PAP) format used throughout the pirate-radio application.

## Overview

The PAP schema ensures that all podcast episodes generated, validated, and orchestrated follow a consistent, type-safe structure. This prevents runtime errors and ensures compatibility between different parts of the system.

## Schema Structure

### Top-Level Fields

```typescript
{
  episode_id: string;      // Unique identifier (e.g., "2023-10-05")
  title: string;           // Episode title
  description: string;     // Episode description
  segments: Segment[];     // Array of segments (see below)
}
```

### Segment Types

The schema uses a **discriminated union** based on the `type` field. This means TypeScript can automatically narrow types based on the segment type.

#### 1. Dialogue Segment

```typescript
{
  id: string;              // Unique segment ID
  type: "dialogue";
  speaker: string;         // e.g., "HOST", "WILLIAM", "HAROLD"
  text: string;            // The dialogue text
  tts_voice: TTSVoice;     // REQUIRED: Voice to use
}
```

**Valid TTS Voices:** `alloy`, `echo`, `fable`, `onyx`, `nova`, `shimmer`, `verse`, `coral`

#### 2. Music Segment

```typescript
{
  id: string;              // Unique segment ID
  type: "music";
  role: MusicRole;         // Role of the music
  prompt: string;          // Music generation prompt
  engine: MusicEngine;     // Music generation engine
}
```

**Valid Music Roles:** `intro_jingle`, `background`, `outro_jingle`, `transition`  
**Valid Music Engines:** `sora`, `udio`, `elevenlabs` (default: `sora`)

#### 3. Ad Segment

```typescript
{
  id: string;              // Unique segment ID
  type: "ad";
  text: string;            // Advertisement text
  tts_voice: TTSVoice;     // REQUIRED: Voice to use
}
```

## How Schema Adherence is Enforced

### 1. **AI Generation (`/api/generate-pap`)**

The `generate-pap` endpoint uses Vercel AI SDK's `streamObject` function with the schema:

```typescript
streamObject({
  model: openai(model),
  schema: podcastAssemblyPlanSchema,
  // ... other options
})
```

The AI SDK:
- ✅ Automatically guides the LLM to follow the schema structure
- ✅ Uses schema descriptions to understand field requirements
- ✅ Ensures generated output matches the Zod schema
- ✅ Provides type-safe streaming

**Enhanced System Prompt:** The endpoint includes explicit instructions about:
- Required fields for each segment type
- Valid enum values for voices and music roles
- Schema rules and constraints

### 2. **Validation (`/api/orchestrate`)**

The orchestrate endpoint validates incoming PAPs using helper functions:

```typescript
const validationResult = validatePAP(body);

if (!validationResult.success) {
  const errorMessages = getValidationErrorMessages(validationResult.errors!);
  // Return detailed error response
}
```

Benefits:
- ✅ Catches malformed PAPs before processing
- ✅ Provides human-readable error messages
- ✅ Prevents downstream errors in TTS/music generation
- ✅ Logs validation errors for debugging

### 3. **Type Safety**

TypeScript types are automatically generated from the Zod schema:

```typescript
export type PodcastAssemblyPlan = z.infer<typeof podcastAssemblyPlanSchema>;
export type Segment = z.infer<typeof segmentSchema>;
export type DialogueSegment = Extract<Segment, { type: "dialogue" }>;
export type MusicSegment = Extract<Segment, { type: "music" }>;
export type AdSegment = Extract<Segment, { type: "ad" }>;
```

Benefits:
- ✅ Compile-time type checking
- ✅ IDE autocomplete and IntelliSense
- ✅ Refactoring safety
- ✅ Self-documenting code

## Best Practices

### For Manual PAP Creation

When creating PAPs manually (e.g., for testing), ensure:

1. **Every dialogue segment has `tts_voice`:**
   ```json
   {
     "type": "dialogue",
     "speaker": "HOST",
     "text": "Welcome to the show!",
     "tts_voice": "nova"  // ✅ Required
   }
   ```

2. **Every ad segment has `tts_voice`:**
   ```json
   {
     "type": "ad",
     "text": "This episode is sponsored by...",
     "tts_voice": "echo"  // ✅ Required
   }
   ```

3. **Use consistent speaker-voice mapping:**
   - HOST → `nova`
   - WILLIAM → `onyx`
   - HAROLD → `alloy`
   - ADS → `echo`

4. **Each segment has a unique ID:**
   ```json
   { "id": "segment-1", ... },
   { "id": "segment-2", ... },
   ```

### For AI Generation

The system prompt in `generate-pap` already includes:
- ✅ Explicit field requirements
- ✅ Valid enum values
- ✅ Schema rules and constraints

If you need to customize generation, update the `defaultSystem` prompt in `/api/generate-pap/route.ts`.

### For Validation

Use the provided helper functions:

```typescript
import { validatePAP, getValidationErrorMessages } from "@/app/const/pap";

const result = validatePAP(unknownData);

if (!result.success) {
  const messages = getValidationErrorMessages(result.errors!);
  // Handle validation errors
} else {
  const pap = result.data; // Type-safe PAP
}
```

## Common Validation Errors

### Missing `tts_voice` on Dialogue

**Error:**
```
segments.2.tts_voice: Required
```

**Fix:**
```json
{
  "type": "dialogue",
  "speaker": "HOST",
  "text": "...",
  "tts_voice": "nova"  // Add this field
}
```

### Invalid Voice Name

**Error:**
```
segments.1.tts_voice: Invalid enum value. Expected 'alloy' | 'echo' | ...
```

**Fix:** Use one of the valid voices: `alloy`, `echo`, `fable`, `onyx`, `nova`, `shimmer`, `verse`, `coral`

### Missing Segment ID

**Error:**
```
segments.3.id: Required
```

**Fix:**
```json
{
  "id": "segment-3",  // Add unique ID
  "type": "dialogue",
  ...
}
```

### Invalid Music Role

**Error:**
```
segments.5.role: Invalid enum value. Expected 'intro_jingle' | 'background' | ...
```

**Fix:** Use one of: `intro_jingle`, `background`, `outro_jingle`, `transition`

## Testing

To test schema validation:

```typescript
import { validatePAP } from "@/app/const/pap";

const testPAP = {
  episode_id: "test-001",
  title: "Test Episode",
  description: "Test description",
  segments: [
    {
      id: "seg-1",
      type: "dialogue",
      speaker: "HOST",
      text: "Hello!",
      tts_voice: "nova",
    },
  ],
};

const result = validatePAP(testPAP);
console.log(result.success); // true
```

## Schema Updates

If you need to modify the schema:

1. **Update** `src/app/const/pap.ts`
2. **Add/update** descriptions for new fields
3. **Update** this README with changes
4. **Update** system prompt in `generate-pap/route.ts`
5. **Test** with sample data to ensure validation works
6. **Consider** backward compatibility

## Related Files

- `/src/app/const/pap.ts` - Schema definition
- `/src/app/api/generate-pap/route.ts` - AI generation with schema
- `/src/app/api/orchestrate/route.ts` - Validation and orchestration
- `/src/app/api/tts/route.ts` - TTS generation for segments

## Additional Resources

- [Zod Documentation](https://zod.dev)
- [Vercel AI SDK - Structured Output](https://sdk.vercel.ai/docs/ai-sdk-core/generating-structured-data)
- [TypeScript Discriminated Unions](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions)

