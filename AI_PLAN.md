# Local Scribe - Project Blueprint & Architecture (Swift Rewrite)

## 1. Project Goal
Build a local-first, privacy-focused meeting assistant that runs as a blazing-fast native macOS application on Apple Silicon.

## 2. Tech Stack (Strict Constraints)
- **Language:** Swift 5.9
- **UI Framework:** SwiftUI
- **Audio Capture:** AVFoundation
- **AI Orchestration:**
  - **Transcription (STT):** WhisperKit (CoreML wrapper for whisper.cpp, optimized for M-series Neural Engine).
  - **Summarization:** Ollama (via native URLSession REST calls to localhost:11434).
- **Package Management:** Swift Package Manager (SPM).

## 3. Architecture & Data Flow
1. **Frontend (SwiftUI):**
   - Captures audio via `AVAudioRecorder` directly to `Documents/recording.m4a`.
   - Minimalist, Notion-style single-window application.
2. **Transcription Service:**
   - Upon stop, loads the `m4a` file directly into WhisperKit.
   - CoreML executes inference on the Apple Neural Engine, returning a full string.
3. **Summarization Service:**
   - Takes the raw transcript string and pushes it to local Ollama via native URLRequest.
   - Decodes the JSON response and updates the UI asynchronously.

## 4. Current Progress
- [x] Deleted legacy web/Rust/Python stack.
- [x] Initialized Swift Package Manager structure (`Package.swift`).
- [x] Built core SwiftUI Interface (`ContentView.swift`).
- [x] Implemented native `AVFoundation` recording.
- [x] Implemented native `WhisperKit` CoreML transcription.
- [x] Connected native `URLSession` to Ollama for summarization.
- [x] Written base XCTest suite.
- [ ] **Next Step:** Implement offline native Diarization (speaker identification) via SFSpeechRecognizer or custom CoreML pipeline (as this was removed during the speed optimization pivot).

## 5. Development Rules for Agent
- **Native First:** Never introduce web-views (WKWebView) or Python sidecars.
- **Concurrency:** Use modern Swift Concurrency (`async/await`, `Task`) to prevent blocking the main thread during ML inference.
- **Error Handling:** Always gracefully handle missing permissions (Microphone) or offline models.