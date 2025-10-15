# Audio Stitching API

## Endpoint: `/api/stitch`

This endpoint stitches together multiple audio files from the `temp_audio` directory into a single MP3 file.

### Requirements

- **FFmpeg** must be installed on your system
  - macOS: `brew install ffmpeg`
  - Ubuntu/Debian: `sudo apt-get install ffmpeg`
  - Windows: Download from [ffmpeg.org](https://ffmpeg.org/download.html)

### Request

**Method:** `POST`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "episode_name": "My Podcast Episode 1",
  "segment_ids": ["episode_dialogue_001", "episode_ad_002", "episode_dialogue_003"]
}
```

#### Parameters

- `episode_name` (string, required): The name of the episode. This will be slugified for the output filename.
- `segment_ids` (array, optional): An ordered array of segment IDs to stitch. If provided, only files matching these IDs will be stitched in the specified order. If omitted, all audio files in `temp_audio` will be stitched in alphabetical order.

### Response

**Success (200):**
```json
{
  "success": true,
  "filename": "my-podcast-episode-1-2025-10-14.mp3",
  "filepath": "/path/to/output/my-podcast-episode-1-2025-10-14.mp3",
  "size": 1234567,
  "files_stitched": 3,
  "source_files": [
    "episode_dialogue_001.mp3",
    "episode_ad_002.mp3",
    "episode_dialogue_003.mp3"
  ]
}
```

**Error (400/404/500):**
```json
{
  "error": "Error message",
  "details": "Detailed error information"
}
```

### Output

The stitched audio file is saved to the `output` directory with the following naming format:

```
{slugified-episode-name}-{YYYY-MM-DD}.mp3
```

For example:
- `episode-name: "Pirate Radio Episode 1"` → `pirate-radio-episode-1-2025-10-14.mp3`
- `episode-name: "The Tech Show #42"` → `the-tech-show-42-2025-10-14.mp3`

### Example Usage

**Stitch all files in order:**
```bash
curl -X POST http://localhost:3000/api/stitch \
  -H "Content-Type: application/json" \
  -d '{"episode_name": "Episode 1"}'
```

**Stitch specific segments in order:**
```bash
curl -X POST http://localhost:3000/api/stitch \
  -H "Content-Type: application/json" \
  -d '{
    "episode_name": "Episode 1",
    "segment_ids": [
      "episode1_dialogue_001",
      "episode1_music_002",
      "episode1_dialogue_003"
    ]
  }'
```

### How It Works

1. Reads audio files from the `temp_audio` directory
2. Orders files by segment_ids (if provided) or using natural sort (handles numbers properly, e.g., `segment-2.mp3` comes before `segment-10.mp3`)
3. Uses FFmpeg's concat filter to stitch files together (robust handling of mixed formats)
4. Normalizes all audio to consistent format (48kHz, stereo, MP3)
5. Outputs a single MP3 file to the `output` directory
6. Returns metadata about the stitched file

### Technical Details

- **Supported audio formats:** mp3, wav, aac, opus, flac, m4a
- **Mixed format support:** Robustly handles any combination of audio formats, sample rates, and channel configurations
- **Output format:** MP3 encoded with libmp3lame at 192 kbps, 48kHz sample rate, stereo
- **FFmpeg method:** Uses concat filter (not demuxer) for maximum compatibility with mixed formats
- **Normalization:** Automatically normalizes all inputs to consistent format during concatenation

