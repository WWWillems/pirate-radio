import { NextRequest, NextResponse } from "next/server";
import * as fs from "fs/promises";
import * as path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// Directory with temporary audio files
const TEMP_AUDIO_DIR = path.join(process.cwd(), "temp_audio");
const OUTPUT_DIR = path.join(process.cwd(), "output");

/**
 * Slugify a string (convert to URL-friendly format)
 */
function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w\-]+/g, "") // Remove all non-word chars
    .replace(/\-\-+/g, "-") // Replace multiple - with single -
    .replace(/^-+/, "") // Trim - from start of text
    .replace(/-+$/, ""); // Trim - from end of text
}

/**
 * Format date as YYYY-MM-DD
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { episode_name = "episode", segment_ids = null } = body;

    // Validate episode_name
    if (!episode_name || typeof episode_name !== "string") {
      return NextResponse.json(
        { error: "Invalid episode_name. Must be a non-empty string." },
        { status: 400 }
      );
    }

    // Check if temp_audio directory exists
    try {
      await fs.access(TEMP_AUDIO_DIR);
    } catch {
      return NextResponse.json(
        { error: "temp_audio directory not found" },
        { status: 404 }
      );
    }

    // Get all audio files from temp_audio directory
    let allFiles = await fs.readdir(TEMP_AUDIO_DIR);
    let audioFiles = allFiles.filter((file) =>
      /\.(mp3|wav|aac|opus|flac|m4a)$/i.test(file)
    );

    // If segment_ids array is provided, filter and order files accordingly
    if (segment_ids && Array.isArray(segment_ids)) {
      const orderedFiles: string[] = [];
      for (const segmentId of segment_ids) {
        // Find file matching this segment ID (e.g., "segmentId.mp3")
        const matchingFile = audioFiles.find((file) =>
          file.startsWith(`${segmentId}.`)
        );
        if (matchingFile) {
          orderedFiles.push(matchingFile);
        }
      }
      if (orderedFiles.length === 0) {
        return NextResponse.json(
          { error: "No matching audio files found for provided segment_ids" },
          { status: 404 }
        );
      }
      audioFiles = orderedFiles;
    } else {
      // Sort files naturally if no segment_ids provided
      audioFiles.sort();
    }

    if (audioFiles.length === 0) {
      return NextResponse.json(
        { error: "No audio files found in temp_audio directory" },
        { status: 404 }
      );
    }

    console.log(`Found ${audioFiles.length} audio file(s) to stitch:`);
    audioFiles.forEach((file, index) => {
      console.log(`  ${index + 1}. ${file}`);
    });

    // Create output directory if it doesn't exist
    await fs.mkdir(OUTPUT_DIR, { recursive: true });

    // Generate output filename with slugified episode name and date
    const slugifiedName = slugify(episode_name);
    const dateStr = formatDate(new Date());
    const outputFilename = `${slugifiedName}-${dateStr}.mp3`;
    const outputPath = path.join(OUTPUT_DIR, outputFilename);

    // Create a temporary file list for ffmpeg
    const fileListPath = path.join(TEMP_AUDIO_DIR, "concat_list.txt");
    const fileListContent = audioFiles
      .map((file) => `file '${path.join(TEMP_AUDIO_DIR, file)}'`)
      .join("\n");

    await fs.writeFile(fileListPath, fileListContent);

    console.log("Stitching audio files with ffmpeg...");
    console.log(`Output: ${outputFilename}`);

    try {
      // Use ffmpeg to concatenate files
      // -f concat: use concat demuxer
      // -safe 0: allow absolute paths
      // -i: input file list
      // -c copy: copy codec (fast, no re-encoding)
      const ffmpegCommand = `ffmpeg -f concat -safe 0 -i "${fileListPath}" -c copy "${outputPath}" -y`;

      const { stdout, stderr } = await execAsync(ffmpegCommand);

      // Log ffmpeg output for debugging
      if (stdout) console.log("FFmpeg stdout:", stdout);
      if (stderr) console.log("FFmpeg stderr:", stderr);

      // Clean up the temporary file list
      await fs.unlink(fileListPath);

      // Get file stats
      const stats = await fs.stat(outputPath);

      console.log(`✓ Successfully stitched audio: ${outputFilename}`);
      console.log(`  Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

      return NextResponse.json({
        success: true,
        filename: outputFilename,
        filepath: outputPath,
        size: stats.size,
        files_stitched: audioFiles.length,
        source_files: audioFiles,
      });
    } catch (error: any) {
      console.error("FFmpeg error:", error);

      // Clean up the temporary file list if it exists
      try {
        await fs.unlink(fileListPath);
      } catch {}

      // Check if ffmpeg is not installed
      if (
        error.message.includes("command not found") ||
        error.code === "ENOENT"
      ) {
        return NextResponse.json(
          {
            error: "FFmpeg is not installed or not found in PATH",
            details:
              "Please install FFmpeg to use the audio stitching feature. Visit https://ffmpeg.org/download.html",
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          error: "Failed to stitch audio files",
          details: error.message || "Unknown error",
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Error in stitch endpoint:", error);

    return NextResponse.json(
      {
        error: "Failed to process stitch request",
        details: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
