
import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useAudioRecorder } from './lib/recorder';

function App() {
  const { isRecording, duration, startRecording, stopRecording, error: recorderError } = useAudioRecorder();

  const [transcription, setTranscription] = useState<string>("");
  const [summary, setSummary] = useState<string>("");
  const [lastFilePath, setLastFilePath] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
      // Using 'any' for now to bypass strict type checking during this rewrite phase
      // Ideally this maps to SidecarOutput
      const result: any = await invoke('transcribe_audio', { filePath: path });
      if (result.status === 'success') {
        const text = result.segments.map((s: any) => `[${s.speaker_id}] ${s.text}`).join('\n');
        setTranscription(text);
        handleSummarize(text);
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
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans p-8 flex flex-col gap-8">

      {/* Header */}
      <header className="flex items-center justify-between border-b pb-4">
        <h1 className="text-2xl font-bold tracking-tight">Local Scribe</h1>
        <div className="text-sm text-neutral-500">Tauri v2 + React</div>
      </header>

      {/* Error Banner */}
      {recorderError && (
        <div className="bg-red-100 text-red-700 p-4 rounded border border-red-200">
          <strong>Error:</strong> {recorderError}
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col items-center justify-center gap-6 py-12 bg-white rounded-xl shadow-sm border">
        <div className="text-6xl font-mono tabular-nums tracking-wider text-slate-700">
          {formatTime(duration)}
        </div>

        <div className="flex gap-4">
          {!isRecording ? (
            <button
              onClick={startRecording}
              disabled={isProcessing}
              className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-full font-bold text-lg shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Start Recording
            </button>
          ) : (
            <button
              onClick={handleStop}
              className="px-8 py-3 bg-neutral-800 hover:bg-neutral-900 text-white rounded-full font-bold text-lg shadow-lg hover:scale-105 transition-all animate-pulse"
            >
              Stop Recording
            </button>
          )}
        </div>

        {isProcessing && (
          <div className="text-neutral-500 animate-pulse">Processing audio...</div>
        )}
      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Transcription */}
        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <span>📄</span> Transcript
          </h2>
          <div className="bg-white p-6 rounded-xl border min-h-[300px] whitespace-pre-wrap leading-relaxed shadow-sm">
            {transcription || <span className="text-neutral-300 italic">No transcript yet...</span>}
          </div>
        </section>

        {/* Summary */}
        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <span>✨</span> AI Summary
          </h2>
          <div className="bg-white p-6 rounded-xl border min-h-[300px] leading-relaxed shadow-sm">
            {summary || <span className="text-neutral-300 italic">No summary yet...</span>}
          </div>
        </section>
      </div>

      {/* Debug Info */}
      {lastFilePath && (
        <div className="text-xs text-neutral-400 font-mono text-center">
          Last saved: {lastFilePath}
        </div>
      )}
    </div>
  );
}

export default App;