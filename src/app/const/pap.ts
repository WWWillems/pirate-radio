import { z } from "zod";

// Define the Podcast Assembly Plan (PAP) schema
export const segmentSchema = z.discriminatedUnion("type", [
  z.object({
    id: z
      .string()
      .describe(
        "Unique identifier for this segment (e.g., 'segment-1', 'episode-001-dialogue-01')"
      ),
    type: z.literal("dialogue"),
    speaker: z
      .string()
      .describe(
        "The speaker name - use consistent identifiers like HOST, GUEST, WILLIAM, HAROLD, etc."
      ),
    text: z
      .string()
      .min(1)
      .describe("The dialogue text to be spoken - should be clear and natural"),
    tts_voice: z
      .enum(["alloy", "echo", "fable", "onyx", "nova", "shimmer"])
      .describe(
        "REQUIRED: The TTS voice to use. Assign consistent voices per speaker for continuity."
      ),
  }),
  z.object({
    id: z
      .string()
      .describe(
        "Unique identifier for this segment (e.g., 'segment-5', 'episode-001-music-01')"
      ),
    type: z.literal("music"),
    role: z
      .enum(["intro_jingle", "background", "outro_jingle", "transition"])
      .describe(
        "The role of the music: intro_jingle (start), outro_jingle (end), transition (between segments), background (under dialogue)"
      ),
    prompt: z
      .string()
      .min(1)
      .describe(
        "Descriptive prompt for music generation (e.g., 'upbeat jazz intro', 'gentle acoustic transition')"
      ),
    engine: z
      .enum(["sora", "udio", "elevenlabs"])
      .default("sora")
      .describe("The music generation engine to use"),
  }),
  z.object({
    id: z
      .string()
      .describe(
        "Unique identifier for this segment (e.g., 'segment-8', 'episode-001-ad-01')"
      ),
    type: z.literal("ad"),
    text: z.string().min(1).describe("The advertisement text to be spoken"),
    tts_voice: z
      .enum(["alloy", "echo", "fable", "onyx", "nova", "shimmer"])
      .describe(
        "REQUIRED: The TTS voice to use for the advertisement (typically a distinct voice)"
      ),
  }),
  z.object({
    id: z
      .string()
      .describe(
        "Unique identifier for this segment (e.g., 'segment-9', 'episode-001-weather-01')"
      ),
    type: z.literal("weather"),
    text: z.string().min(1).describe("The weather text to be spoken"),
    tts_voice: z
      .enum(["alloy", "echo", "fable", "onyx", "nova", "shimmer"])
      .describe("The TTS voice to use for the weather"),
  }),
]);

export const podcastAssemblyPlanSchema = z.object({
  episode_id: z
    .string()
    .min(1)
    .describe(
      "Unique episode identifier (e.g., date in YYYY-MM-DD format or episode number)"
    ),
  title: z
    .string()
    .min(1)
    .describe("The episode title - should be clear and engaging"),
  description: z
    .string()
    .min(1)
    .describe("The episode description - a brief summary of the content"),
  segments: z
    .array(segmentSchema)
    .min(1)
    .describe(
      "Array of podcast segments in sequential order - must include at least one segment"
    ),
});

// Export TypeScript types
export type Segment = z.infer<typeof segmentSchema>;
export type PodcastAssemblyPlan = z.infer<typeof podcastAssemblyPlanSchema>;

// Type guards for runtime type checking
export type DialogueSegment = Extract<Segment, { type: "dialogue" }>;
export type MusicSegment = Extract<Segment, { type: "music" }>;
export type AdSegment = Extract<Segment, { type: "ad" }>;

/**
 * Helper function to validate a PAP and return detailed error information
 */
export function validatePAP(data: unknown): {
  success: boolean;
  data?: PodcastAssemblyPlan;
  errors?: z.ZodIssue[];
} {
  const result = podcastAssemblyPlanSchema.safeParse(data);

  if (result.success) {
    return {
      success: true,
      data: result.data,
    };
  }

  return {
    success: false,
    errors: result.error.issues,
  };
}

/**
 * Get human-readable validation errors
 */
export function getValidationErrorMessages(errors: z.ZodIssue[]): string[] {
  return errors.map((error) => {
    const path = error.path.join(".");
    return `${path}: ${error.message}`;
  });
}
