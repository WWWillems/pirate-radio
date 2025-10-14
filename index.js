import * as fal from "@fal-ai/serverless-client";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure fal.ai client
fal.config({
  credentials: process.env.FAL_KEY,
});

async function textToSpeech(
  text,
  outputPath = "output.wav",
  voice = "af_heart"
) {
  try {
    console.log("Generating speech from text...");
    console.log("Text:", text);
    console.log("Voice:", voice);
    console.log("Provider: fal.ai\n");

    // Call Kokoro-82M via fal.ai
    const result = await fal.subscribe("fal-ai/kokoro/american-english", {
      input: {
        text: text,
        voice: voice,
        speed: 1.0,
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          console.log("Processing...");
        }
      },
    });
    console.log(result);
    if (!result.audio) {
      throw new Error("No audio returned from API");
    }

    console.log("Downloading audio...");

    // Download the audio file
    const audioResponse = await fetch(result.audio.url);
    const buffer = Buffer.from(await audioResponse.arrayBuffer());

    // Save to file
    const fullPath = path.join(__dirname, outputPath);
    fs.writeFileSync(fullPath, buffer);

    console.log(`✓ Audio saved to: ${fullPath}`);
    console.log(`✓ File size: ${(buffer.length / 1024).toFixed(2)} KB`);
    console.log(`✓ Duration: ${result.duration?.toFixed(2) || "N/A"} seconds`);

    return fullPath;
  } catch (error) {
    console.error("\n❌ Error generating speech:", error.message);

    if (!process.env.FAL_KEY) {
      console.error("\n📝 FAL_KEY not found!");
      console.error("   Get your API key at: https://fal.ai/dashboard/keys");
      console.error("   Add to .env file: FAL_KEY=your_key_here\n");
    }

    throw error;
  }
}

// Example usage
async function main() {
  const textToConvert =
    process.argv[2] ||
    "Hello! This is a test of the Kokoro text to speech model.";
  const outputFile = process.argv[3] || "output.wav";
  const voice = process.argv[4] || "af_heart"; // Default voice

  // Check for FAL_KEY
  if (!process.env.FAL_KEY) {
    console.error("❌ Error: FAL_KEY not found in environment variables.");
    console.error("   Get your API key at: https://fal.ai/dashboard/keys");
    console.error("   Add to .env file: FAL_KEY=your_key_here\n");
    process.exit(1);
  }

  console.log(
    "\nAvailable voices: af_heart, af_bella, af_sarah, am_adam, am_michael, bf_emma, bf_isabella, bm_george, bm_lewis"
  );
  console.log(
    "(See https://huggingface.co/hexgrad/Kokoro-82M/blob/main/VOICES.md for full list)\n"
  );

  await textToSpeech(textToConvert, outputFile, voice);
}

// Run if this is the main module
main().catch(console.error);

export { textToSpeech };
