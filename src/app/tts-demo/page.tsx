'use client';

import { useState } from 'react';
import ttsSystemPrompt from '../const/tts-system-prompt';
import generationPrompt from '../const/generation-prompt';

export default function TextToSpeechDemo() {
  const [activeTab, setActiveTab] = useState<'controls' | 'visualizer'>('controls');
  const [systemPrompt, setSystemPrompt] = useState(ttsSystemPrompt);
  const [prompt, setPrompt] = useState(generationPrompt);
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
  const models = [ "gpt-4o-mini-tts", 'tts-1', 'tts-1-hd'];
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
          //temperature: 0.8,
          //maxTokens: 150,
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

  // Parse PAP from text
  const parsePAP = () => {
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  };

  const pap = parsePAP();

  return (
    <div className="min-h-screen p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">🏴‍☠️ Pirate Radio</h1>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 border-b">
        <button
          onClick={() => setActiveTab('controls')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'controls'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Controls
        </button>
        <button
          onClick={() => setActiveTab('visualizer')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'visualizer'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          PAP Visualizer
        </button>
      </div>

      {/* Controls Tab */}
      {activeTab === 'controls' && (
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
      )}

      {/* PAP Visualizer Tab */}
      {activeTab === 'visualizer' && (
        <div className="space-y-6">
          {!pap ? (
            <div className="p-8 bg-gray-900 border-2 border-dashed border-gray-700 rounded-lg text-center">
              <p className="text-gray-400 text-lg mb-2">No PAP to visualize</p>
              <p className="text-gray-500 text-sm">
                Generate or paste a PAP JSON in the Controls tab to see it visualized here
              </p>
            </div>
          ) : (
            <>
              {/* Episode Header */}
              <div className="bg-gradient-to-r from-purple-900/40 to-pink-900/40 border border-purple-700/50 rounded-lg p-6">
                <h2 className="text-2xl font-bold text-purple-200 mb-2">
                  {pap.title || 'Untitled Episode'}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="font-semibold text-purple-300">Episode ID:</span>{' '}
                    <span className="text-purple-400">{pap.episode_id || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-purple-300">Total Segments:</span>{' '}
                    <span className="text-purple-400">{pap.segments?.length || 0}</span>
                  </div>
                </div>
                {pap.description && (
                  <p className="mt-3 text-purple-300 italic">{pap.description}</p>
                )}
              </div>

              {/* Segments Timeline */}
              <div className="space-y-3">
                <h3 className="text-xl font-bold text-gray-200">Segments</h3>
                {pap.segments?.map((segment: any, index: number) => {
                  const isDialogue = segment.type === 'dialogue';
                  const isMusic = segment.type === 'music';
                  const isAd = segment.type === 'ad';
                  const isWeather = segment.type === 'weather';
                 
                  let bgColor = 'bg-gray-800/50';
                  let borderColor = 'border-gray-600';
                  let textColor = 'text-gray-200';
                  let iconColor = 'text-gray-400';
                  let badgeBgColor = 'bg-gray-700';
                  let icon = '📄';
                  
                  if (isDialogue) {
                    bgColor = 'bg-blue-900/30';
                    borderColor = 'border-blue-700/50';
                    textColor = 'text-blue-200';
                    iconColor = 'text-blue-400';
                    badgeBgColor = 'bg-blue-800';
                    icon = '💬';
                  } else if (isMusic) {
                    bgColor = 'bg-green-900/30';
                    borderColor = 'border-green-700/50';
                    textColor = 'text-green-200';
                    iconColor = 'text-green-400';
                    badgeBgColor = 'bg-green-800';
                    icon = '🎵';
                  } else if (isAd) {
                    bgColor = 'bg-yellow-900/30';
                    borderColor = 'border-yellow-700/50';
                    textColor = 'text-yellow-200';
                    iconColor = 'text-yellow-400';
                    badgeBgColor = 'bg-yellow-800';
                    icon = '📢';
                  }else if (isWeather) {
                    bgColor = 'bg-gray-800/30';
                    borderColor = 'border-gray-600/50';
                    textColor = 'text-gray-200';
                    iconColor = 'text-gray-400';
                    badgeBgColor = 'bg-gray-700';
                    icon = '🌤️';
                  }

                  return (
                    <div
                      key={segment.id || index}
                      className={`${bgColor} border ${borderColor} rounded-lg p-4 relative`}
                    >
                      {/* Segment Number Badge */}
                      <div className={`absolute -left-3 -top-3 w-8 h-8 ${badgeBgColor} ${textColor} rounded-full flex items-center justify-center font-bold text-sm border-2 border-black`}>
                        {index + 1}
                      </div>

                      <div className="flex items-start gap-3">
                        <div className={`text-2xl ${iconColor}`}>{icon}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`${textColor} font-bold text-lg uppercase`}>
                              {segment.type}
                            </span>
                            {segment.id && (
                              <span className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded border border-gray-700">
                                {segment.id}
                              </span>
                            )}
                          </div>

                          {isDialogue && (
                            <>
                              {segment.speaker && (
                                <div className={`${iconColor} font-semibold text-sm mb-1`}>
                                  Speaker: {segment.speaker}
                                </div>
                              )}
                              {segment.text && (
                                <p className={`${textColor} mb-2`}>{segment.text}</p>
                              )}
                              {segment.tts_voice && (
                                <div className="flex gap-2 flex-wrap">
                                  <span className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded border border-gray-700">
                                    Voice: {segment.tts_voice}
                                  </span>
                                </div>
                              )}
                            </>
                          )}

                          {isMusic && (
                            <>
                              {segment.role && (
                                <div className={`${iconColor} font-semibold text-sm mb-1`}>
                                  Role: {segment.role}
                                </div>
                              )}
                              {segment.prompt && (
                                <p className={`${textColor} mb-2 italic`}>
                                  "{segment.prompt}"
                                </p>
                              )}
                              {segment.engine && (
                                <span className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded border border-gray-700">
                                  Engine: {segment.engine}
                                </span>
                              )}
                            </>
                          )}

                          {isAd && (
                            <>
                              {segment.advertiser && (
                                <div className={`${iconColor} font-semibold text-sm mb-1`}>
                                  Advertiser: {segment.advertiser}
                                </div>
                              )}
                              {segment.text && (
                                <p className={`${textColor} mb-2`}>{segment.text}</p>
                              )}
                              {segment.tts_voice && (
                                <span className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded border border-gray-700">
                                  Voice: {segment.tts_voice}
                                </span>
                              )}
                            </>
                          )}

                          {isWeather && (
                            <>{console.log(segment)}
                              {segment.text && (
                                <p className={`${textColor} mb-2`}>{segment.text}</p>
                              )}
                              {segment.tts_voice && (
                                <span className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded border border-gray-700">
                                  Voice: {segment.tts_voice}
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      
    </div>
  );
}

