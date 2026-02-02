import { useState, useRef, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { AudioRecorder } from "./lib/recorder";
import type { SidecarOutput, HelperSegment } from "./lib/types";

const recorder = new AudioRecorder();

/**
 * Main Application Component.
 *
 * Orchestrates the user flow:
 * 1. Recording Audio (via `AudioRecorder`)
 * 2. Transcribing File (via Tauri `transcribe_audio` command)
 * 3. Summarizing Text (via Tauri `summarize_text` command / Ollama)
 */
function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState<HelperSegment[]>([]);
  const [summary, setSummary] = useState<string>("");
  const [audioPath, setAudioPath] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const transcriptionRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of transcription
  useEffect(() => {
    if (transcriptionRef.current) {
      transcriptionRef.current.scrollTop = transcriptionRef.current.scrollHeight;
    }
  }, [transcription]);

  /**
   * Starts the audio recording session.
   * Resets previous state (transcription, summary) for a fresh start.
   */
  async function startRecording() {
    try {
      await recorder.start();
      setIsRecording(true);
      setTranscription([]);
      setSummary("");
      setAudioPath(null);
    } catch (e) {
      console.error("Failed to start recording:", e);
    }
  }

  async function stopRecording() {
    try {
      const path = await recorder.stop();
      setAudioPath(path);
      setIsRecording(false);
    } catch (e) {
      console.error("Failed to stop recording:", e);
    }
  }

  /**
   * Invokes the Python sidecar to transcribe the recorded file.
   * Handles the `SidecarOutput` and maps it to the UI state.
   */
  async function transcribe() {
    if (!audioPath) return;

    setIsLoading(true);
    setSummary("");
    try {
      const result = await invoke<SidecarOutput>("transcribe_audio", { filePath: audioPath });

      if (result.status === 'success') {
        setTranscription(result.segments);
      } else {
        console.error("Sidecar error:", result.error_message);
        setTranscription([{
          start: 0, end: 0, speaker_id: "System",
          text: `Error: ${result.error_message}`
        }]);
      }
    } catch (e) {
      console.error("Transcription failed:", e);
      setTranscription([{
        start: 0, end: 0, speaker_id: "System",
        text: `Critical Error: ${e}`
      }]);
    } finally {
      setIsLoading(false);
    }
  }

  async function summarize() {
    if (transcription.length === 0) return;

    setIsSummarizing(true);
    try {
      const fullText = transcription.map(s => `[${s.speaker_id}] ${s.text}`).join("\n");
      const result = await invoke<string>("summarize_text", { text: fullText });
      setSummary(result);
    } catch (e) {
      console.error("Summarization failed:", e);
      setSummary(`Error: ${e}`);
    } finally {
      setIsSummarizing(false);
    }
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-slate-200">

      {/* Main Container - Document Style */}
      <div className="max-w-3xl mx-auto px-12 py-16 flex flex-col gap-10 min-h-screen">

        {/* Header - Minimal title with icon */}
        <header className="flex items-center gap-3 border-b border-slate-100 pb-6">
          <div className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded text-lg">📝</div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">Untitled Meeting</h1>
          <span className="text-xs text-slate-400 font-mono ml-auto">Local Scribe</span>
        </header>

        {/* Toolbar - Minimalist Buttons */}
        <div className="flex items-center gap-3">
          {!isRecording ? (
            <button
              onClick={startRecording}
              className="flex items-center gap-2 px-3 py-1.5 rounded hover:bg-slate-100 transition-colors text-sm font-medium text-slate-600 border border-transparent hover:border-slate-200"
            >
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              Record
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="flex items-center gap-2 px-3 py-1.5 rounded bg-red-50 hover:bg-red-100 transition-colors text-sm font-medium text-red-600 border border-red-200 animate-pulse"
            >
              <div className="w-2 h-2 bg-red-600 rounded-sm"></div>
              Stop
            </button>
          )}

          <div className="h-4 w-px bg-slate-200 mx-1"></div>

          <button
            onClick={transcribe}
            disabled={!audioPath || isRecording || isLoading}
            className={`text-sm font-medium px-3 py-1.5 rounded transition-colors ${(!audioPath || isRecording || isLoading)
              ? 'text-slate-300 cursor-not-allowed'
              : 'text-slate-600 hover:bg-slate-100'
              }`}
          >
            {isLoading ? "Transcribing..." : "Transcribe"}
          </button>

          <button
            onClick={summarize}
            disabled={transcription.length === 0 || isSummarizing || isRecording}
            className={`text-sm font-medium px-3 py-1.5 rounded transition-colors ${(transcription.length === 0 || isSummarizing || isRecording)
              ? 'text-slate-300 cursor-not-allowed'
              : 'text-slate-600 hover:bg-slate-100'
              }`}
          >
            {isSummarizing ? "Summarizing..." : "Summarize API"}
          </button>

          {/* Audio File Status */}
          {audioPath && !isRecording && (
            <span className="ml-auto text-xs font-mono text-slate-400 max-w-[150px] truncate">
              {audioPath.split('/').pop()}
            </span>
          )}
        </div>

        {/* AI Summary Block - Notion "Callout" Style */}
        {summary && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-md flex gap-4">
            <div className="text-xl">✨</div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-slate-700 mb-1 uppercase tracking-wide">Summary</h3>
              <div className="text-sm leading-relaxed text-slate-600 whitespace-pre-wrap">{summary}</div>
            </div>
          </div>
        )}

        {/* Transcript Area - Continuous Document Flow */}
        <div ref={transcriptionRef} className="flex-1 flex flex-col gap-6 ">
          {transcription.length > 0 ? (
            transcription.map((seg, idx) => (
              <div key={idx} className="group relative pl-4 border-l-2 border-transparent hover:border-slate-200 transition-colors">
                {/* Speaker Label only if different from previous */}
                {(idx === 0 || transcription[idx - 1].speaker_id !== seg.speaker_id) && (
                  <div className="text-xs font-bold text-slate-500 mb-1 flex items-center gap-2">
                    {seg.speaker_id}
                    <span className="font-normal text-slate-300 font-mono text-[10px]">{new Date(seg.start * 1000).toISOString().substr(14, 5)}</span>
                  </div>
                )}
                <p className="text-base text-slate-800 leading-relaxed theme-serif">{seg.text}</p>
              </div>
            ))
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-300 gap-2">
              <div className="text-4xl opacity-20">📄</div>
              <p className="font-medium">Start recording to create a transcript</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default App;