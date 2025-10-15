import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      text,
      voice = "alloy", // Default voice
      model = "gpt-4o-mini-tts", // or "tts-1-hd" for higher quality
      speed = 1.0,
      response_format = "mp3", // mp3, opus, aac, flac, wav, or pcm
    } = body;

    // Validate required parameters
    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    // Validate voice parameter
    const validVoices = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"];
    if (!validVoices.includes(voice)) {
      return NextResponse.json(
        {
          error: `Invalid voice. Must be one of: ${validVoices.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Validate response format
    const validFormats = ["mp3", "opus", "aac", "flac", "wav", "pcm"];
    if (!validFormats.includes(response_format)) {
      return NextResponse.json(
        {
          error: `Invalid response_format. Must be one of: ${validFormats.join(
            ", "
          )}`,
        },
        { status: 400 }
      );
    }

    // Call OpenAI TTS API
    console.log("Generating speech with OpenAI TTS...");
    console.log("Model:", model);
    console.log("Voice:", voice);
    console.log("Text:", text.substring(0, 100) + "...");

    const mp3Response = await openai.audio.speech.create({
      model: model,
      voice: voice,
      input: text,
      speed: speed,
      response_format: response_format,
    });

    // Get the audio buffer
    const buffer = Buffer.from(await mp3Response.arrayBuffer());

    // Determine content type based on format
    const contentTypes: Record<string, string> = {
      mp3: "audio/mpeg",
      opus: "audio/opus",
      aac: "audio/aac",
      flac: "audio/flac",
      wav: "audio/wav",
      pcm: "audio/pcm",
    };

    // Return the audio file
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentTypes[response_format] || "audio/mpeg",
        "Content-Length": buffer.length.toString(),
        "Content-Disposition": `attachment; filename="speech.${response_format}"`,
      },
    });
  } catch (error: any) {
    console.error("Error generating speech:", error);

    // Handle OpenAI API errors
    if (error?.status === 401) {
      return NextResponse.json(
        { error: "Invalid OpenAI API key" },
        { status: 401 }
      );
    }

    if (error?.status === 429) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to generate speech",
        details: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
