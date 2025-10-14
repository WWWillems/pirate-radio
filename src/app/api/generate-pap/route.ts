import { podcastAssemblyPlanSchema } from "@/app/const/pap";
import { openai } from "@ai-sdk/openai";
import { streamObject } from "ai";
import { NextRequest } from "next/server";
import { z } from "zod";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      prompt,
      model = "gpt-4o-mini", // Default to gpt-4o-mini for cost efficiency
      temperature = 0.7,
      maxTokens = 2000,
      system,
    } = body;

    // Validate required parameters
    if (!prompt) {
      return new Response(JSON.stringify({ error: "Prompt is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Default system message for podcast generation if none provided
    const defaultSystem = `You are an expert podcast producer. Generate a detailed Podcast Assembly Plan (PAP) that includes dialogue segments with appropriate character voices, music cues for intro/outro/background, and any ad breaks. Be creative and engaging while maintaining historical or topical accuracy.`;

    // Create the streaming response using Vercel AI SDK with structured output
    const result = streamObject({
      model: openai(model),
      schema: podcastAssemblyPlanSchema,
      prompt: prompt,
      system: system || defaultSystem,
      temperature,
    });

    // Return the streaming response
    return result.toTextStreamResponse();
  } catch (error: any) {
    console.error("Error generating podcast plan:", error);

    // Handle various error cases
    if (error?.status === 401 || error?.message?.includes("API key")) {
      return new Response(JSON.stringify({ error: "Invalid OpenAI API key" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (error?.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
        status: 429,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        error: "Failed to generate podcast plan",
        details: error?.message || "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
