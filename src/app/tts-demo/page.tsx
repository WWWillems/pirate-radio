'use client';

import { useState } from 'react';

export default function TextToSpeechDemo() {
  const [text, setText] = useState(
    'Hello! This is a demo of OpenAI text to speech.'
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
      const response = await fetch('/api/tts', {
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
      const response = await fetch('/api/tts', {
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
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: 'Generate a creative and interesting pirate-themed story or message in 2-3 sentences.',
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

  return (
    <div className="min-h-screen p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">🏴‍☠️ Pirate Radio</h1>

      <div className="space-y-6">
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
              onClick={generateText}
              disabled={generating}
              className="bg-purple-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition text-sm"
            >
              {generating ? '✨ Generating...' : '✨ Generate Text'}
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

