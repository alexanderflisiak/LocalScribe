# Local Scribe - Project Blueprint & Architecture

## 1. Project Goal
Build a local-first, privacy-focused meeting assistant that runs entirely on Apple Silicon (MacBook) and Standard CPUs (ThinkPad). 
The app records audio, identifies speakers (Diarization), transcribes text, and generates summaries using a local LLM.

## 2. Tech Stack (Strict Constraints)
- **Core Shell:** Tauri v2 (Rust) - Chosen for low RAM usage (~30MB idle).
- **Frontend:** React + TypeScript + Tailwind CSS.
- **Database:** SQLite (via `tauri-plugin-sql`) - Single file storage (`local_scribe.db`).
- **AI Orchestration:**
  - **Text:** Ollama (serving `qwen2.5-coder:7b` locally).
  - **Audio:** Python Sidecar (packaged via PyInstaller).
  - **Models:** `SenseVoiceSmall` (STT) and `Pyannote 3.1` (Diarization).

## 3. Architecture & Data Flow
1. **Frontend (React):** - Captures audio via `MediaRecorder`.
   - Saves `.webm` chunks to `$APPDATA/recordings/`.
   - Writes metadata to SQLite.
2. **Backend (Tauri/Rust):** - Spawns the Python Sidecar as a child process.
   - Bridges events between Python (stdout) and React (window events).
3. **Sidecar (Python):** - Inputs: Audio file path.
   - Outputs: JSON object with segments `[{ start, end, text, speaker_id }]`.
4. **Publishing:** - Future feature: Export summaries to Google Docs/Notion via REST API.

## 4. Current Progress
- [x] Tauri v2 initialized.
- [x] SQLite database wired (`src/lib/db.ts`) with basic CRUD.
- [x] Audio Recorder implemented (`src/lib/recorder.ts`) saving to AppData.
- [x] Python Sidecar implemented (`sidecar/main.py`) with SenseVoice.
- [x] Integrate Local LLM (Ollama) for Summarization.
- [x] Implement Audio Diarization (Pyannote).
- [x] Update UI to display Speaker Labels.
- [x] Redesign UI (Notion Style).
- [ ] **Next Step:** Implement Export (Markdown/PDF).

## 5. Development Rules for Agent
- **Strict Typing:** No `any`. Use Interfaces for all data models.
- **Testing:** Use `vitest` with mocks for Tauri plugins.
- **Permissions:** Always check `capabilities/default.json` when adding OS features.