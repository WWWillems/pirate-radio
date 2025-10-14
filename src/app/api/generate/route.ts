import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { NextRequest } from "next/server";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      prompt,
      model = "gpt-4o-mini", // Default to gpt-4o-mini for cost efficiency
      temperature = 0.7,
      maxTokens = 1000,
      system,
    } = body;

    // Validate required parameters
    if (!prompt) {
      return new Response(JSON.stringify({ error: "Prompt is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Create the streaming response using Vercel AI SDK
    const result = streamText({
      model: openai(model),
      prompt: prompt,
      ...(system && { system }), // Optional system message
      temperature,
      maxOutputTokens: maxTokens,
    });

    // Return the streaming response
    return result.toTextStreamResponse();
  } catch (error: any) {
    console.error("Error generating text:", error);

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
        error: "Failed to generate text",
        details: error?.message || "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
