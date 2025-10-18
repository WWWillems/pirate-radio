import { podcastAssemblyPlanSchema } from "@/app/const/pap";
import { openai } from "@ai-sdk/openai";
import { generateObject, generateText, stepCountIs, tool } from "ai";
import { NextRequest } from "next/server";
import { z } from "zod";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

const AVAILABLE_MODELS = {
  "gpt-5": "gpt-5-2025-08-07",
  "gpt-4o-mini": "gpt-4o-mini",
};

// Define tools using the tool() function from Vercel AI SDK
const tools = {
  getCurrentDateTime: tool({
    description:
      "Get the current date and time. Use this to make podcast content timely and relevant.",
    inputSchema: z.object({
      timezone: z
        .string()
        .optional()
        .describe(
          "Optional timezone (e.g., 'America/New_York', 'Asia/Tokyo', 'UTC')"
        ),
    }),
    execute: async ({ timezone }) => {
      console.log(`> TOOL CALL: Current date requested:`, timezone);

      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
        timeZoneName: "short",
      };

      if (timezone) {
        options.timeZone = timezone;
      }

      return {
        dateTime: now.toLocaleString("en-US", options),
        timestamp: now.toISOString(),
        dayOfWeek: now.toLocaleDateString("en-US", { weekday: "long" }),
        date: now.toLocaleDateString("en-US"),
        time: now.toLocaleTimeString("en-US"),
      };
    },
  }),
  getCurrentWeather: tool({
    description:
      "Get the current weather for a location. Use this to make weather-related content in the podcast.",
    inputSchema: z.object({
      location: z
        .string()
        .describe(
          "The city and state/country (e.g., 'Halifax, Nova Scotia', 'Tokyo, Japan')"
        ),
    }),
    execute: async ({ location }) => {
      console.log(`> TOOL CALL: Weather requested for: ${location}`);

      const weatherResult = await fetch(
        `https://rt.ambientweather.net/v1/devices?applicationKey=${process.env.AMBIENT_WEATHER_APPLICATION_KEY}&apiKey=${process.env.AMBIENT_WEATHER_API_KEY}`
      );

      const weatherResultJson = await weatherResult.json();
      console.log(`> TOOL RESULT: Weather result:`, weatherResultJson);
      return weatherResultJson?.[0];
    },
  }),
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      prompt,
      model = AVAILABLE_MODELS["gpt-5"],
      temperature = 0.7,
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
    const defaultSystem =
      system ||
      "You are a creative podcast producer. Use the available tools to get current information like date/time and weather to make the content timely and relevant. Call the tools as needed to gather context for your podcast plan. After gathering the necessary information with tools, generate a complete podcast assembly plan.";

    // Step 1: Use tools to gather context (date/time, weather, etc.)
    const contextResult = await generateText({
      model: openai(model),
      tools,
      stopWhen: stepCountIs(5),
      system: `You are a friendly and knowledgeable weather expert hosting the daily weather segment of a podcast.

Your job is to:
- Accurately retrieve and report the current date, time, and local weather conditions (temperature, wind, precipitation, etc.) for the specified location.
- Present the information in a natural, conversational, and engaging tone, suitable for audio narration.
- Optionally add brief contextual remarks (e.g., “Perfect day for a walk,” or “Better grab your umbrella!”) to make it sound human and relatable.
- Keep your report concise (under 60 seconds), simple, friendly, and clear — like a morning radio host who’s both informative and entertaining.
- Report in Celsius`,
      prompt: `Get the current date and time using the getCurrentDateTime tool. Get the weather using the getCurrentWeather tool with location "Glenelg, Nova Scotia". Then write a brief 2-3 sentence natural description of the current date, time, and weather conditions.`,
    });

    const promptWithContext = `${prompt}\n\nCurrent date time and weather:\n${contextResult.text}`;

    console.log(promptWithContext);

    // Step 2: Generate the validated structured object, injecting the gathered context
    const result = await generateObject({
      model: openai(model),
      schema: podcastAssemblyPlanSchema,
      system: defaultSystem,
      prompt: promptWithContext,
    });

    return Response.json(result.object);
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
