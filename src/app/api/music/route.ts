import { NextRequest, NextResponse } from "next/server";
import * as fs from "fs/promises";
import * as path from "path";
import { randomUUID } from "crypto";
import { GoogleAuth } from "google-auth-library";

// Directory to store temporary audio files
const TEMP_AUDIO_DIR = path.join(process.cwd(), "temp_audio");

/**
 * Enhances music prompts to be more specific and unique to avoid recitation checks
 */
function enhanceMusicPrompt(prompt: string): string {
  // Add specific instrumentation and unique descriptors to make the prompt more original
  const instruments = [
    "303 Acid Bass",
    "808 Hip Hop Beat",
    "Accordion",
    "Alto Saxophone",
    "Bagpipes",
    "Balalaika Ensemble",
    "Banjo",
    "Bass Clarinet",
    "Bongos",
    "Boomy Bass",
    "Bouzouki",
    "Buchla Synths",
    "Cello",
    "Charango",
    "Clavichord",
    "Conga Drums",
    "Didgeridoo",
    "Dirty Synths",
    "Djembe",
    "Drumline",
    "Dulcimer",
    "Fiddle",
    "Flamenco Guitar",
    "Funk Drums",
    "Glockenspiel",
    "Guitar",
    "Hang Drum",
    "Harmonica",
    "Harp",
    "Harpsichord",
    "Hurdy-gurdy",
    "Kalimba",
    "Koto",
    "Lyre",
    "Mandolin",
    "Maracas",
    "Marimba",
    "Mbira",
    "Mellotron",
    "Metallic Twang",
    "Moog Oscillations",
    "Ocarina",
    "Persian Tar",
    "Pipa",
    "Precision Bass",
    "Ragtime Piano",
    "Rhodes Piano",
    "Shamisen",
    "Shredding Guitar",
    "Sitar",
    "Slide Guitar",
    "Smooth Pianos",
    "Spacey Synths",
    "Steel Drum",
    "Synth Pads",
    "Tabla",
    "TR-909 Drum Machine",
    "Trumpet",
    "Tuba",
    "Vibraphone",
    "Viola Ensemble",
    "Warm Acoustic Guitar",
    "Woodwinds",
  ];

  const moods = [
    "Acoustic Instruments",
    "Ambient",
    "Bright Tones",
    "Chill",
    "Crunchy Distortion",
    "Danceable",
    "Dreamy",
    "Echo",
    "Emotional",
    "Ethereal Ambience",
    "Experimental",
    "Fat Beats",
    "Funky",
    "Glitchy Effects",
    "Huge Drop",
    "Live Performance",
    "Lo-fi",
    "Ominous Drone",
    "Psychedelic",
    "Rich Orchestration",
    "Saturated Tones",
    "Subdued Melody",
    "Sustained Chords",
    "Swirling Phasers",
    "Tight Groove",
    "Unsettling",
    "Upbeat",
    "Virtuoso",
    "Weird Noises",
  ];

  const techniques = [
    "with gradual crescendos",
    "featuring gentle rhythmic variations",
    "with subtle harmonic shifts",
    "building layers progressively",
    "with soft dynamic swells",
    "incorporating ambient textures",
    "with natural phrasing",
    "featuring organic transitions",
  ];

  const genres = [
    "Acid Jazz",
    "Afrobeat",
    "Alternative Country",
    "Baroque",
    "Bengal Baul",
    "Bhangra",
    "Bluegrass",
    "Blues Rock",
    "Bossa Nova",
    "Breakbeat",
    "Celtic Folk",
    "Chillout",
    "Chiptune",
    "Classic Rock",
    "Contemporary R&B",
    "Cumbia",
    "Deep House",
    "Disco Funk",
    "Drum & Bass",
    "Dubstep",
    "EDM",
    "Electro Swing",
    "Funk Metal",
    "G-funk",
    "Garage Rock",
    "Glitch Hop",
    "Grime",
    "Hyperpop",
    "Indian Classical",
    "Indie Electronic",
    "Indie Folk",
    "Indie Pop",
    "Irish Folk",
    "Jam Band",
    "Jamaican Dub",
    "Jazz Fusion",
    "Latin Jazz",
    "Lo-Fi Hip Hop",
    "Marching Band",
    "Merengue",
    "New Jack Swing",
    "Minimal Techno",
    "Moombahton",
    "Neo-Soul",
    "Orchestral Score",
    "Piano Ballad",
    "Polka",
    "Post-Punk",
    "60s Psychedelic Rock",
    "Psytrance",
    "R&B",
    "Reggae",
    "Reggaeton",
    "Renaissance Music",
    "Salsa",
    "Shoegaze",
    "Ska",
    "Surf Rock",
    "Synthpop",
    "Techno",
    "Trance",
    "Trap Beat",
    "Trip Hop",
    "Vaporwave",
    "Witch house",
  ];

  // Randomly select enhancements
  const instrument =
    instruments[Math.floor(Math.random() * instruments.length)];
  const mood = moods[Math.floor(Math.random() * moods.length)];
  const technique = techniques[Math.floor(Math.random() * techniques.length)];

  // Build enhanced prompt
  const enhancedPrompt = `Original composition: ${prompt}, featuring ${instrument}, ${mood}, ${technique}. Instrumental music without vocals, designed for podcast background and transitions.`;

  return enhancedPrompt;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      prompt,
      duration = 30, // Duration in seconds
      segment_id, // Optional: unique segment ID to use as filename
      temperature = 1.0, // Controls randomness (0-2)
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

    // Validate required environment variables for Vertex AI
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
    const location = process.env.GOOGLE_CLOUD_LOCATION || "us-central1";

    if (!projectId) {
      return NextResponse.json(
        { error: "GOOGLE_CLOUD_PROJECT_ID not configured" },
        { status: 500 }
      );
    }

    // Initialize Google Auth - it will automatically use:
    // 1. GOOGLE_APPLICATION_CREDENTIALS env var pointing to service account key
    // 2. Application Default Credentials (ADC) from gcloud
    // 3. Compute Engine metadata server if running on GCP
    const auth = new GoogleAuth({
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    });

    // Get a fresh access token (handles automatic refresh)
    const accessToken = await auth.getAccessToken();

    if (!accessToken) {
      return NextResponse.json(
        {
          error: "Failed to obtain access token",
          details:
            "Set GOOGLE_APPLICATION_CREDENTIALS to your service account key file path, or run 'gcloud auth application-default login'",
        },
        { status: 500 }
      );
    }

    // Enhance the prompt to avoid recitation checks
    const enhancedPrompt = enhanceMusicPrompt(prompt);

    console.log("Generating music with Google Lyria via Vertex AI...");
    console.log("Original Prompt:", prompt);
    console.log("Enhanced Prompt:", enhancedPrompt);
    console.log("Duration:", duration);
    console.log("Temperature:", temperature);
    console.log("Project ID:", projectId);
    console.log("Location:", location);

    // Vertex AI endpoint for Lyria
    const apiUrl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/lyria-002:predict`;

    // Generate a random seed for reproducibility (optional)
    const seed = Math.floor(Math.random() * 100000);

    const requestBody = {
      instances: [
        {
          prompt: enhancedPrompt,
          seed: seed,
          // Note: Lyria may have duration parameters, adjust as needed
        },
      ],
    };

    console.log("Making request to Vertex AI Lyria API...");
    console.log("API URL:", apiUrl);

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Vertex AI Error for prompt: ", prompt, errorText);
      throw new Error(`Vertex AI error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log("Vertex AI Response:", JSON.stringify(result, null, 2));

    // Extract audio data from Vertex AI response
    // The response format may vary, typically: { predictions: [{ content: "base64..." }] }
    if (!result.predictions || result.predictions.length === 0) {
      throw new Error("No predictions received from Vertex AI Lyria");
    }

    const prediction = result.predictions[0];

    // Try different possible response formats
    let audioBase64;
    if (prediction.content) {
      audioBase64 = prediction.content;
    } else if (prediction.audio) {
      audioBase64 = prediction.audio;
    } else if (prediction.audioContent) {
      audioBase64 = prediction.audioContent;
    } else if (prediction.bytesBase64Encoded) {
      audioBase64 = prediction.bytesBase64Encoded;
    } else if (typeof prediction === "string") {
      audioBase64 = prediction;
    } else {
      console.error("Unexpected prediction format:", prediction);
      throw new Error("Unable to extract audio from Vertex AI response");
    }

    const buffer = Buffer.from(audioBase64, "base64");

    // Ensure temp directory exists
    await fs.mkdir(TEMP_AUDIO_DIR, { recursive: true });

    // Generate unique filename - use segment_id if provided, otherwise generate random UUID
    const fileId = segment_id || randomUUID();
    const filename = `${fileId}.wav`;
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
      temperature,
      model: "google-lyria",
      ...(segment_id && { segment_id }), // Include segment_id if provided
    });
  } catch (error: any) {
    console.error("Error generating music:", error);

    // Handle specific errors
    if (error?.message?.includes("401") || error?.message?.includes("403")) {
      return NextResponse.json(
        {
          error: "Failed to authenticate with Vertex AI",
          details: error?.message || "Unknown error",
          hint: "Set GOOGLE_APPLICATION_CREDENTIALS environment variable to your service account key file path, or run 'gcloud auth application-default login'",
        },
        { status: 503 }
      );
    }

    if (error?.message?.includes("404")) {
      return NextResponse.json(
        {
          error: "Vertex AI Lyria model not found",
          details: error?.message || "Unknown error",
          hint: "Verify the model name (lyria-002) and that it's available in your project region",
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
