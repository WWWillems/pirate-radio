import { z } from "zod";

// Define the Podcast Assembly Plan (PAP) schema
export const segmentSchema = z.discriminatedUnion("type", [
  z.object({
    id: z.string().describe("Unique identifier for this segment"),
    type: z.literal("dialogue"),
    speaker: z
      .string()
      .describe("The speaker name (e.g., HOST, WILLIAM, HAROLD)"),
    text: z.string().describe("The dialogue text"),
    tts_voice: z
      .enum([
        "alloy",
        "echo",
        "fable",
        "onyx",
        "nova",
        "shimmer",
        "verse",
        "coral",
      ])
      .describe("The TTS voice to use"),
  }),
  z.object({
    id: z.string().describe("Unique identifier for this segment"),
    type: z.literal("music"),
    role: z
      .enum(["intro_jingle", "background", "outro_jingle", "transition"])
      .describe("The role of the music"),
    prompt: z.string().describe("The music generation prompt"),
    engine: z
      .enum(["sora", "udio", "elevenlabs"])
      .default("sora")
      .describe("The music generation engine"),
  }),
  z.object({
    id: z.string().describe("Unique identifier for this segment"),
    type: z.literal("ad"),
    text: z.string().describe("The advertisement text"),
    tts_voice: z
      .enum([
        "alloy",
        "echo",
        "fable",
        "onyx",
        "nova",
        "shimmer",
        "verse",
        "coral",
      ])
      .describe("The TTS voice to use"),
  }),
]);

export const podcastAssemblyPlanSchema = z.object({
  episode_id: z
    .string()
    .describe("Unique episode identifier (e.g., date in YYYY-MM-DD format)"),
  title: z.string().describe("The episode title"),
  description: z.string().describe("The episode description"),
  segments: z
    .array(segmentSchema)
    .describe("Array of podcast segments in order"),
});
