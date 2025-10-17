import { podcastAssemblyPlanSchema } from "@/app/const/pap";
import { openai } from "@ai-sdk/openai";
import { generateObject, generateText, tool } from "ai";
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

      // TODO: Integrate with a real weather API (e.g., OpenWeatherMap, WeatherAPI)
      // Uncomment and configure when you add a weather API:
      /*
      const apiKey = process.env.WEATHER_API_KEY;
      if (!apiKey) {
        return {
          location,
          error: "Weather API key not configured",
        };
      }
      
      try {
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&appid=${apiKey}&units=metric`
        );
        
        if (!response.ok) {
          return {
            location,
            error: `Weather API error: ${response.statusText}`,
          };
        }
        
        const data = await response.json();
        return {
          location,
          temperature: `${data.main.temp}°C`,
          feelsLike: `${data.main.feels_like}°C`,
          condition: data.weather[0].description,
          humidity: `${data.main.humidity}%`,
          windSpeed: `${data.wind.speed} m/s`,
        };
      } catch (error) {
        return {
          location,
          error: "Failed to fetch weather data",
        };
      }
      */

      // Placeholder response - replace with actual API call above
      return {
        location,
        note: "Weather API not configured. Set WEATHER_API_KEY environment variable and uncomment the API code in route.ts",
        temperature: "N/A",
        condition: "Unknown",
      };
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
      system: defaultSystem,
      tools,
      // Ask the model to summarize any tool results as compact JSON
      prompt: `${prompt}\n\nIf helpful, call tools first. Then output ONLY a compact JSON object with keys you gathered (e.g., dateTime, dayOfWeek, weather: { location, temperature, condition }). Do not include any prose.`,
    });

    let contextJson: Record<string, unknown> = {};
    try {
      contextJson = JSON.parse(contextResult.text);
    } catch {
      // If the model didn't return JSON, proceed without extra context
      contextJson = {};
    }

    // Step 2: Generate the validated structured object, injecting the gathered context
    const result = await generateObject({
      model: openai(model),
      schema: podcastAssemblyPlanSchema,
      system: defaultSystem,
      prompt: `${prompt}\n\nContext (from tools):\n${JSON.stringify(
        contextJson
      )}`,
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
