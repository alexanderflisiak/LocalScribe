import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useAudioRecorder } from './lib/recorder';

function App() {
  const {
    isRecording,
    duration,
    startRecording,
    stopRecording,
    error: recorderError,
    devices,
    refreshDevices
  } = useAudioRecorder();

  const [transcription, setTranscription] = useState<string>("");
  const [summary, setSummary] = useState<string>("");
  const [lastFilePath, setLastFilePath] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = async () => {
    await startRecording(selectedDeviceId || undefined);
  };

  const handleStop = async () => {
    const path = await stopRecording();
    if (path) {
      setLastFilePath(path);
      handleTranscribe(path);
    }
  };

  const handleTranscribe = async (path: string) => {
    setIsProcessing(true);
    setTranscription("Transcribing...");
    try {
      // Using 'any' for Sidecar response shape
      const result: any = await invoke('transcribe_audio', { filePath: path });
      if (result.status === 'success') {
        const text = result.segments
          .filter((s: any) => s.text && s.text.trim().length > 0)
          .map((s: any) => `[${s.speaker_id}] ${s.text}`)
          .join('\n');

        setTranscription(text || "No speech detected.");
        if (text) handleSummarize(text);
      } else {
        setTranscription(`Error: ${result.error_message}`);
      }
    } catch (err: any) {
      setTranscription(`Transcription Failed: ${err}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSummarize = async (text: string) => {
    try {
      const summary = await invoke<string>('summarize_text', { text });
      setSummary(summary);
    } catch (err) {
      console.error("Summary failed:", err);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F7F5] text-[#37352F] font-sans selection:bg-[#2383E2] selection:text-white">

      {/* Container */}
      <div className="max-w-4xl mx-auto p-8 md:p-12 flex flex-col gap-12">

        {/* Header */}
        <header className="flex flex-col gap-4 border-b border-[#E9E9E7] pb-8">
          <div className="flex items-center gap-3 text-[#787774]">
            <span className="text-xl">🎙️</span>
            <span className="text-sm font-medium uppercase tracking-wider">Local Scribe</span>
          </div>
          <h1 className="text-5xl font-bold tracking-tight text-[#37352F] font-serif">
            Meeting Notes
          </h1>

          <div className="flex items-center justify-between text-sm text-[#9B9A97] mt-2">
            <div className="flex items-center gap-2">
              <span>{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              <span>•</span>
              <span>v0.2.0</span>
            </div>

            {/* Device Selector */}
            <div className="flex items-center gap-2">
              <select
                className="bg-transparent border-b border-[#E9E9E7] hover:border-[#37352F] py-1 pr-8 focus:outline-none transition-colors cursor-pointer"
                value={selectedDeviceId}
                onChange={(e) => setSelectedDeviceId(e.target.value)}
              >
                <option value="">Default Microphone</option>
                {devices.map(d => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.label}
                  </option>
                ))}
              </select>
              <button
                onClick={refreshDevices}
                className="hover:text-[#37352F] transition-colors"
                title="Refresh Devices"
              >
                ↻
              </button>
            </div>
          </div>
        </header>

        {/* Control Center */}
        <div className="bg-white rounded-xl border border-[#E9E9E7] shadow-sm p-8 flex flex-col items-center justify-center gap-8 hover:shadow-md transition-shadow">

          {/* Timer */}
          <div className={`font-mono text-7xl tracking-tighter tabular-nums transition-colors duration-300 ${isRecording ? 'text-[#E03E3E]' : 'text-[#37352F]'}`}>
            {formatTime(duration)}
          </div>

          {/* Status Badge */}
          <div className="h-6">
            {isRecording ? (
              <div className="flex items-center gap-2 px-3 py-1 bg-[#FDE8E8] text-[#E03E3E] text-xs font-semibold rounded-full animate-pulse">
                <div className="w-2 h-2 bg-current rounded-full" />
                RECORDING
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1 bg-[#F1F0EF] text-[#787774] text-xs font-semibold rounded-full">
                READY
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-4">
            {!isRecording ? (
              <button
                onClick={handleStart}
                disabled={isProcessing}
                className="px-8 py-3 bg-[#37352F] hover:bg-[#2F2F2F] text-white rounded-lg font-medium text-lg transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Start Recording
              </button>
            ) : (
              <button
                onClick={handleStop}
                className="px-8 py-3 bg-white border border-[#E9E9E7] hover:bg-[#F7F7F5] text-[#37352F] rounded-lg font-medium text-lg transition-all"
              >
                Stop & Transcribe
              </button>
            )}
          </div>

          {/* Error Banner */}
          {recorderError && (
            <div className="text-sm text-[#E03E3E] bg-[#FDE8E8] px-4 py-2 rounded-md">
              {recorderError}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">

          {/* Transcript */}
          <section className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold flex items-center gap-2 border-b border-[#E9E9E7] pb-2">
              <span className="text-[#787774]">📄</span> Transcript
            </h2>
            <div className="bg-white rounded-lg border border-[#E9E9E7] p-6 min-h-[400px] text-[15px] leading-relaxed text-[#37352F] whitespace-pre-wrap font-serif">
              {isProcessing ? (
                <div className="flex flex-col gap-3 animate-pulse opacity-50">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  <span className="text-sm text-[#9B9A97] mt-2">Transcribing with local AI...</span>
                </div>
              ) : (
                transcription || <span className="text-[#9B9A97] italic">No transcript available.</span>
              )}
            </div>
          </section>

          {/* Summary */}
          <section className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold flex items-center gap-2 border-b border-[#E9E9E7] pb-2">
              <span className="text-[#AB9AFA]">✨</span> Summary
            </h2>
            <div className="bg-[#FBFBFA] rounded-lg border border-[#E9E9E7] p-6 min-h-[400px] text-[15px] leading-relaxed text-[#37352F]">
              {summary ? (
                <div className="prose prose-sm prose-p:my-2 prose-ul:my-2 text-[#37352F]">
                  {summary}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-[#9B9A97] gap-2 opacity-50">
                  <span className="text-2xl">🪄</span>
                  <span className="text-sm italic text-center">Summary will appear here</span>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Footer */}
        {lastFilePath && (
          <div className="text-xs text-[#9B9A97] font-mono text-center pt-8 border-t border-[#E9E9E7]">
            Saved to: {lastFilePath}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;