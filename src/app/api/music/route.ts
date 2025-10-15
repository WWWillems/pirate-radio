import { NextRequest, NextResponse } from "next/server";
// @ts-expect-error - Gradio client types are not fully available
import { client } from "@gradio/client";
import * as fs from "fs/promises";
import * as path from "path";
import { randomUUID } from "crypto";

// Directory to store temporary audio files
const TEMP_AUDIO_DIR = path.join(process.cwd(), "temp_audio");

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("Body:", body);
    const {
      prompt,
      duration = 30, // Duration in seconds
      segment_id, // Optional: unique segment ID to use as filename
      steps = 50, // Number of inference steps
      cfg_scale = 7.5, // Classifier-free guidance scale
    } = body;

    // Validate required parameters
    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    // Validate duration
    if (duration < 1 || duration > 300) {
      return NextResponse.json(
        { error: "Duration must be between 1 and 300 seconds" },
        { status: 400 }
      );
    }

    console.log("Generating music with ACE-Step...");
    console.log("Prompt:", prompt);
    console.log("Duration:", duration);
    console.log("Steps:", steps);
    console.log("CFG Scale:", cfg_scale);

    // Connect to the Hugging Face Space
    const app = await client("ACE-Step/ACE-Step");

    // Call the prediction API
    const result = await app.predict("/__call__", {
      prompt: prompt,
      lyrics: "",
      audio_duration: duration,
      infer_step: 60,
      //cfg_scale: cfg_scale,
    });

    // The result should contain the audio file
    // @ts-ignore - Gradio client types can be complex
    const audioData = result.data;

    if (!audioData || !audioData[0]) {
      throw new Error("No audio data received from the model");
    }

    // Get the audio file URL or data
    // @ts-ignore
    const audioUrl = audioData[0].url || audioData[0];

    // Download the audio file if it's a URL
    let buffer: Buffer;

    if (typeof audioUrl === "string" && audioUrl.startsWith("http")) {
      console.log("Downloading audio from:", audioUrl);
      const response = await fetch(audioUrl);
      if (!response.ok) {
        throw new Error(`Failed to download audio: ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else {
      // If it's already a buffer or data
      buffer = Buffer.from(audioUrl);
    }

    // Ensure temp directory exists
    await fs.mkdir(TEMP_AUDIO_DIR, { recursive: true });

    // Generate unique filename - use segment_id if provided, otherwise generate random UUID
    const fileId = segment_id || randomUUID();
    const filename = `${fileId}.mp3`;
    const filepath = path.join(TEMP_AUDIO_DIR, filename);

    // Save the audio file to server
    await fs.writeFile(filepath, buffer);

    console.log(`Music file saved: ${filename}`);

    // Return metadata about the saved file
    return NextResponse.json({
      success: true,
      filename,
      filepath,
      size: buffer.length,
      format: "mp3",
      type: "music",
      prompt,
      duration,
      steps,
      cfg_scale,
      ...(segment_id && { segment_id }), // Include segment_id if provided
    });
  } catch (error: any) {
    console.error("Error generating music:", error);

    // Handle specific errors
    if (error?.message?.includes("connect")) {
      return NextResponse.json(
        {
          error: "Failed to connect to Hugging Face Space",
          details: error?.message || "Unknown error",
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to generate music",
        details: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
