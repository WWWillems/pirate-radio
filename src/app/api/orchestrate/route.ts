import { podcastAssemblyPlanSchema } from "@/app/const/pap";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate the PAP structure
    const validationResult = podcastAssemblyPlanSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid Podcast Assembly Plan format",
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const pap = validationResult.data;

    console.log("=".repeat(60));
    console.log("PODCAST ORCHESTRATION PLAN");
    console.log("=".repeat(60));
    console.log(`Episode ID: ${pap.episode_id}`);
    console.log(`Title: ${pap.title}`);
    console.log(`Description: ${pap.description}`);
    console.log(`Total Segments: ${pap.segments.length}`);
    console.log("=".repeat(60));
    console.log();

    // Process each segment and log which API will be called
    pap.segments.forEach((segment, index) => {
      console.log(`[Segment ${index + 1}/${pap.segments.length}]`);

      switch (segment.type) {
        case "dialogue":
          console.log(`  Type: Dialogue`);
          console.log(`  Speaker: ${segment.speaker}`);
          console.log(`  Voice: ${segment.tts_voice}`);
          console.log(
            `  Text: ${segment.text.substring(0, 100)}${
              segment.text.length > 100 ? "..." : ""
            }`
          );
          console.log(`  → Will call: /api/tts`);
          console.log(
            `    Payload: { text, voice: "${segment.tts_voice}", model: "tts-1" }`
          );
          break;

        case "music":
          console.log(`  Type: Music`);
          console.log(`  Role: ${segment.role}`);
          console.log(`  Engine: ${segment.engine}`);
          console.log(
            `  Prompt: ${segment.prompt.substring(0, 100)}${
              segment.prompt.length > 100 ? "..." : ""
            }`
          );
          console.log(`  → Will call: /api/music/${segment.engine}`);
          console.log(
            `    Payload: { prompt: "${segment.prompt}", role: "${segment.role}" }`
          );
          break;

        case "ad":
          console.log(`  Type: Advertisement`);
          console.log(`  Voice: ${segment.tts_voice}`);
          console.log(
            `  Text: ${segment.text.substring(0, 100)}${
              segment.text.length > 100 ? "..." : ""
            }`
          );
          console.log(`  → Will call: /api/tts`);
          console.log(
            `    Payload: { text, voice: "${segment.tts_voice}", model: "tts-1" }`
          );
          break;

        default:
          console.log(`  Type: Unknown`);
          console.log(`  → Will skip: Unknown segment type`);
      }

      console.log();
    });

    console.log("=".repeat(60));
    console.log("ORCHESTRATION PLAN COMPLETE");
    console.log("=".repeat(60));

    // Return a success response with a summary
    return NextResponse.json(
      {
        success: true,
        message: "Podcast Assembly Plan received and processed",
        summary: {
          episode_id: pap.episode_id,
          title: pap.title,
          total_segments: pap.segments.length,
          segment_breakdown: {
            dialogue: pap.segments.filter((s) => s.type === "dialogue").length,
            music: pap.segments.filter((s) => s.type === "music").length,
            ads: pap.segments.filter((s) => s.type === "ad").length,
          },
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error processing Podcast Assembly Plan:", error);

    return NextResponse.json(
      {
        error: "Failed to process Podcast Assembly Plan",
        details: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
