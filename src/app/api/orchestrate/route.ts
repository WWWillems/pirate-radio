import {
  podcastAssemblyPlanSchema,
  validatePAP,
  getValidationErrorMessages,
} from "@/app/const/pap";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Auto-generate IDs for segments that don't have them
    if (body.segments && Array.isArray(body.segments)) {
      body.segments = body.segments.map((segment: any, index: number) => {
        if (!segment.id) {
          // Generate a predictable ID: episodeId_segmentType_index
          const episodePrefix = body.episode_id || "episode";
          const typePrefix = segment.type || "segment";
          segment.id = `${episodePrefix}_${typePrefix}_${String(index).padStart(
            3,
            "0"
          )}`;
        }
        return segment;
      });
    }

    // Validate the PAP structure
    const validationResult = validatePAP(body);

    if (!validationResult.success) {
      const errorMessages = getValidationErrorMessages(
        validationResult.errors!
      );
      console.error("❌ PAP Validation Failed:");
      errorMessages.forEach((msg) => console.error(`  - ${msg}`));

      return NextResponse.json(
        {
          error: "Invalid Podcast Assembly Plan format",
          details: validationResult.errors,
          messages: errorMessages,
        },
        { status: 400 }
      );
    }

    const pap = validationResult.data!;

    console.log("=".repeat(60));
    console.log("PODCAST ORCHESTRATION PLAN");
    console.log("=".repeat(60));
    console.log(`Episode ID: ${pap.episode_id}`);
    console.log(`Title: ${pap.title}`);
    console.log(`Description: ${pap.description}`);
    console.log(`Total Segments: ${pap.segments.length}`);
    console.log("=".repeat(60));
    console.log();

    // Get the base URL for API calls
    const baseUrl = new URL(request.url).origin;

    // Process each segment
    const processedSegments = [];

    for (let index = 0; index < pap.segments.length; index++) {
      const segment = pap.segments[index];
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
          console.log(`  → Calling: /api/tts`);

          try {
            const ttsResponse = await fetch(`${baseUrl}/api/tts`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                text: segment.text,
                voice: segment.tts_voice,
                //model: "tts-1",
                type: segment.type, // Send segment type
                segment_id: segment.id, // Send unique segment ID
              }),
            });

            if (!ttsResponse.ok) {
              const errorData = await ttsResponse.json();
              console.error(`    ✗ TTS API call failed:`, errorData);
              processedSegments.push({
                segment_index: index,
                type: "dialogue",
                status: "failed",
                error: errorData,
              });
            } else {
              const ttsResult = await ttsResponse.json();
              console.log(`    ✓ TTS generated: ${ttsResult.filename}`);
              processedSegments.push({
                segment_index: index,
                type: "dialogue",
                status: "success",
                result: ttsResult,
              });
            }
          } catch (error: any) {
            console.error(`    ✗ TTS API call error:`, error.message);
            processedSegments.push({
              segment_index: index,
              type: "dialogue",
              status: "error",
              error: error.message,
            });
          }
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
          processedSegments.push({
            segment_index: index,
            type: "music",
            status: "skipped",
            note: "Music API not yet implemented",
          });
          break;

        case "ad":
          console.log(`  Type: Advertisement`);
          console.log(`  Voice: ${segment.tts_voice}`);
          console.log(
            `  Text: ${segment.text.substring(0, 100)}${
              segment.text.length > 100 ? "..." : ""
            }`
          );
          console.log(`  → Calling: /api/tts`);

          try {
            const ttsResponse = await fetch(`${baseUrl}/api/tts`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                text: segment.text,
                voice: segment.tts_voice,
                //model: "tts-1",
                type: segment.type, // Send segment type
                segment_id: segment.id, // Send unique segment ID
              }),
            });

            if (!ttsResponse.ok) {
              const errorData = await ttsResponse.json();
              console.error(`    ✗ TTS API call failed:`, errorData);
              processedSegments.push({
                segment_index: index,
                type: "ad",
                status: "failed",
                error: errorData,
              });
            } else {
              const ttsResult = await ttsResponse.json();
              console.log(`    ✓ TTS generated: ${ttsResult.filename}`);
              processedSegments.push({
                segment_index: index,
                type: "ad",
                status: "success",
                result: ttsResult,
              });
            }
          } catch (error: any) {
            console.error(`    ✗ TTS API call error:`, error.message);
            processedSegments.push({
              segment_index: index,
              type: "ad",
              status: "error",
              error: error.message,
            });
          }
          break;

        default:
          console.log(`  Type: Unknown`);
          console.log(`  → Will skip: Unknown segment type`);
          processedSegments.push({
            segment_index: index,
            type: "unknown",
            status: "skipped",
            note: "Unknown segment type",
          });
      }

      console.log();
    }

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
        processed_segments: processedSegments,
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
