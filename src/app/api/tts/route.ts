import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import * as fs from "fs/promises";
import * as path from "path";
import { randomUUID } from "crypto";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Directory to store temporary audio files
const TEMP_AUDIO_DIR = path.join(process.cwd(), "temp_audio");

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      text,
      voice = "alloy", // Default voice
      model = "gpt-4o-mini-tts", // or "tts-1" or "tts-1-hd" for higher quality
      speed = 1.0,
      response_format = "mp3", // mp3, opus, aac, flac, wav, or pcm
      type, // Optional: segment type (dialogue, ad, etc.)
      segment_id, // Optional: unique segment ID to use as filename
    } = body;

    // Validate required parameters
    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    // Validate segment type if provided
    if (type) {
      const validTypes = ["dialogue", "ad", "music"];
      if (!validTypes.includes(type)) {
        return NextResponse.json(
          {
            error: `Invalid type. Must be one of: ${validTypes.join(", ")}`,
          },
          { status: 400 }
        );
      }
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
    if (type) {
      console.log("Type:", type);
    }
    console.log("Text:", text.substring(0, 100) + "...");

    const mp3Response = await openai.audio.speech.create({
      model: model,
      voice: voice,
      input: text,
      speed: speed,
      instructions: `
      Use the emotional cues in parentheses to indicate the speaker's emotion, but never mention them in the speech.
Use natural pauses and hesitations.`,
      response_format: response_format,
    });

    // Get the audio buffer
    const buffer = Buffer.from(await mp3Response.arrayBuffer());

    // Ensure temp directory exists
    await fs.mkdir(TEMP_AUDIO_DIR, { recursive: true });

    // Generate unique filename - use segment_id if provided, otherwise generate random UUID
    const fileId = segment_id || randomUUID();
    const filename = `${fileId}.${response_format}`;
    const filepath = path.join(TEMP_AUDIO_DIR, filename);

    // Save the audio file to server
    await fs.writeFile(filepath, buffer);

    console.log(`Audio file saved: ${filename}`);

    // Return metadata about the saved file
    return NextResponse.json({
      success: true,
      filename,
      filepath,
      size: buffer.length,
      format: response_format,
      voice,
      model,
      ...(type && { type }), // Include type if provided
      ...(segment_id && { segment_id }), // Include segment_id if provided
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
