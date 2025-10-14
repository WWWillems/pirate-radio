'use client';

import { useState } from 'react';

export default function TextToSpeechDemo() {
  const [systemPrompt, setSystemPrompt] = useState(
    `You are a creative radio host who writes engaging and entertaining Podcast Assembly Plans (PAP). The podcast assembly plan describes the structure and timeline for the generated podcast in a predefined JSON format.
    
    You are an expert podcast producer. Generate a detailed Podcast Assembly Plan (PAP) that strictly adheres to the following requirements:

    SEGMENT TYPES:
    1. dialogue - Requires: speaker (e.g., HOST, WILLIAM, HAROLD), text, and tts_voice
    2. music - Requires: role (intro_jingle/background/outro_jingle/transition), prompt, and engine (sora/udio/elevenlabs)
    3. ad - Requires: text and tts_voice

    VALID TTS VOICES: alloy, echo, fable, onyx, nova, shimmer, verse, coral

    IMPORTANT RULES:
    - Every dialogue segment MUST have a tts_voice field
    - Every ad segment MUST have a tts_voice field
    - Each segment MUST have a unique id
    - Use consistent speakers throughout the episode
    - Assign distinct voices to different speakers for variety

    Be creative and engaging while maintaining the schema structure.
    `
  );
  const [prompt, setPrompt] = useState(
    'Generate a concise script for a radio show about Nova Scotia, Canada.'
  );
  const [text, setText] = useState(
    ''
  );
  const [voice, setVoice] = useState('alloy');
  const [model, setModel] = useState('tts-1');
  const [speed, setSpeed] = useState(1.0);
  const [format, setFormat] = useState('mp3');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [orchestrating, setOrchestrating] = useState(false);
  const [orchestrationResult, setOrchestrationResult] = useState<any>(null);
  const [stitching, setStitching] = useState(false);
  const [stitchResult, setStitchResult] = useState<any>(null);

  const voices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
  const models = ['tts-1', 'tts-1-hd'];
  const formats = ['mp3', 'opus', 'aac', 'flac', 'wav'];

  const generateSpeech = async () => {
    setLoading(true);
    setError(null);

    // Stop any currently playing audio
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setCurrentAudio(null);
      setIsPlaying(false);
    }

    try {
      const response = await fetch('/api/tts-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          voice,
          model,
          speed,
          response_format: format,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate speech');
      }

      // Create audio blob and play
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      
      // Set up event handlers
      audio.onended = () => {
        URL.revokeObjectURL(url);
        setIsPlaying(false);
        setCurrentAudio(null);
      };
      
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        setIsPlaying(false);
        setCurrentAudio(null);
      };

      await audio.play();
      setCurrentAudio(audio);
      setIsPlaying(true);
    } catch (err: any) {
      console.error('Error generating speech:', err);
      setError(err.message || 'Failed to generate speech');
    } finally {
      setLoading(false);
    }
  };

  const stopSpeech = () => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setCurrentAudio(null);
      setIsPlaying(false);
    }
  };

  const downloadSpeech = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/tts-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          voice,
          model,
          speed,
          response_format: format,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate speech');
      }

      // Download the file
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `speech.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Error downloading speech:', err);
      setError(err.message || 'Failed to download speech');
    } finally {
      setLoading(false);
    }
  };

  const generateText = async () => {
    setGenerating(true);
    setError(null);
    setText(''); // Clear the text field

    try {
      const response = await fetch('/api/generate-pap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          system: systemPrompt,
          temperature: 0.8,
          maxTokens: 150,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate text');
      }

      // Handle the streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let generatedText = '';

      if (!reader) {
        throw new Error('No response body');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Decode the chunk and append directly to the text
        const chunk = decoder.decode(value, { stream: true });
        generatedText += chunk;
        setText(generatedText);
      }
    } catch (err: any) {
      console.error('Error generating text:', err);
      setError(err.message || 'Failed to generate text');
    } finally {
      setGenerating(false);
    }
  };

  const orchestrate = async () => {
    setOrchestrating(true);
    setError(null);
    setOrchestrationResult(null);

    try {
      // Parse the JSON text
      let parsedText;
      try {
        parsedText = JSON.parse(text);
      } catch (parseError) {
        throw new Error('Invalid JSON format. Please ensure the text is valid JSON.');
      }

      const response = await fetch('/api/orchestrate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(parsedText),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to orchestrate');
      }

      setOrchestrationResult(data);
    } catch (err: any) {
      console.error('Error orchestrating:', err);
      setError(err.message || 'Failed to orchestrate');
    } finally {
      setOrchestrating(false);
    }
  };

  const stitch = async () => {
    setStitching(true);
    setError(null);
    setStitchResult(null);

    try {
      // Extract episode name and segment IDs from orchestration result
      const episodeName = orchestrationResult?.summary?.title || 'episode';
      
      // Extract segment IDs from the orchestration result
      let segmentIds: string[] | null = null;
      if (orchestrationResult?.results && Array.isArray(orchestrationResult.results)) {
        segmentIds = orchestrationResult.results
          .filter((result: any) => result.success && result.audio_file)
          .map((result: any) => result.segment_id);
      }

      const response = await fetch('/api/stitch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          episode_name: episodeName,
          segment_ids: segmentIds,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to stitch audio');
      }

      setStitchResult(data);
    } catch (err: any) {
      console.error('Error stitching:', err);
      setError(err.message || 'Failed to stitch audio');
    } finally {
      setStitching(false);
    }
  };

  return (
    <div className="min-h-screen p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">🏴‍☠️ Pirate Radio</h1>

      <div className="space-y-6">
        {/* System Prompt Input */}
        <div>
          <label className="block text-sm font-medium mb-2">
            System Prompt
          </label>
          <textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            className="w-full p-3 border rounded-lg min-h-20"
            placeholder="Define the AI's role and behavior..."
          />
          <p className="text-sm text-gray-500 mt-1">
            {systemPrompt.length} characters
          </p>
        </div>

        {/* Prompt Input */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Generation Prompt
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full p-3 border rounded-lg min-h-24"
            placeholder="Enter a prompt for text generation..."
          />
          <div className="flex justify-between items-center mt-1">
            <p className="text-sm text-gray-500">
              {prompt.length} characters
            </p>
            <button
              onClick={generateText}
              disabled={generating || !prompt.trim()}
              className="bg-purple-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition text-sm"
            >
              {generating ? '✨ Generating...' : '✨ Generate Text'}
            </button>
          </div>
        </div>

        {/* Text Input */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Text to Convert
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full p-3 border rounded-lg min-h-32"
            placeholder="Enter text to convert to speech..."
            maxLength={4096}
          />
          <div className="flex justify-between items-center mt-1">
            <p className="text-sm text-gray-500">
              {text.length} / 4096 characters
            </p>
            <button
              onClick={orchestrate}
              disabled={orchestrating || !text.trim()}
              className="bg-orange-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition text-sm"
            >
              {orchestrating ? '🎬 Orchestrating...' : '🎬 Orchestrate'}
            </button>
          </div>
        </div>

        {/* Voice Selection */}
        <div>
          <label className="block text-sm font-medium mb-2">Voice</label>
          <select
            value={voice}
            onChange={(e) => setVoice(e.target.value)}
            className="w-full p-3 border rounded-lg"
          >
            {voices.map((v) => (
              <option key={v} value={v}>
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Model Selection */}
        <div>
          <label className="block text-sm font-medium mb-2">Model</label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full p-3 border rounded-lg"
          >
            {models.map((m) => (
              <option key={m} value={m}>
                {m} {m === 'tts-1-hd' ? '(High Definition)' : '(Standard)'}
              </option>
            ))}
          </select>
        </div>

        {/* Speed Control */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Speed: {speed.toFixed(2)}x
          </label>
          <input
            type="range"
            min="0.25"
            max="4.0"
            step="0.25"
            value={speed}
            onChange={(e) => setSpeed(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Format Selection */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Audio Format
          </label>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            className="w-full p-3 border rounded-lg"
          >
            {formats.map((f) => (
              <option key={f} value={f}>
                {f.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Orchestration Result Display */}
        {orchestrationResult && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-2">
              ✅ Orchestration Successful
            </h3>
            <div className="text-sm text-green-700 space-y-1">
              <p><strong>Episode ID:</strong> {orchestrationResult.summary?.episode_id}</p>
              <p><strong>Title:</strong> {orchestrationResult.summary?.title}</p>
              <p><strong>Total Segments:</strong> {orchestrationResult.summary?.total_segments}</p>
              {orchestrationResult.summary?.segment_breakdown && (
                <p>
                  <strong>Breakdown:</strong> {orchestrationResult.summary.segment_breakdown.dialogue} dialogue, {orchestrationResult.summary.segment_breakdown.music} music, {orchestrationResult.summary.segment_breakdown.ads} ads
                </p>
              )}
            </div>
            <button
              onClick={stitch}
              disabled={stitching}
              className="mt-3 bg-indigo-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition text-sm"
            >
              {stitching ? '🎵 Stitching...' : '🎵 Stitch Audio'}
            </button>
          </div>
        )}

        {/* Stitch Result Display */}
        {stitchResult && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">
              🎉 Stitching Complete!
            </h3>
            <div className="text-sm text-blue-700 space-y-1">
              <p><strong>Filename:</strong> {stitchResult.filename}</p>
              <p><strong>Size:</strong> {(stitchResult.size / 1024 / 1024).toFixed(2)} MB</p>
              <p><strong>Files Stitched:</strong> {stitchResult.files_stitched}</p>
              {stitchResult.source_files && (
                <div className="mt-2">
                  <p><strong>Source Files:</strong></p>
                  <ul className="list-disc list-inside ml-2">
                    {stitchResult.source_files.map((file: string, index: number) => (
                      <li key={index}>{file}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={generateSpeech}
            disabled={loading || !text.trim()}
            className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
          >
            {loading ? 'Generating...' : '🔊 Play Speech'}
          </button>
          {isPlaying && (
            <button
              onClick={stopSpeech}
              className="flex-1 bg-red-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-red-700 transition"
            >
              ⏹️ Stop
            </button>
          )}
          <button
            onClick={downloadSpeech}
            disabled={loading || !text.trim()}
            className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
          >
            {loading ? 'Generating...' : '⬇️ Download'}
          </button>
        </div>
      </div>

      
    </div>
  );
}

