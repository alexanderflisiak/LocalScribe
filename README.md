# 🎙️ Local Scribe


[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
![Tauri](https://img.shields.io/badge/Tauri-2.0-24C8D6?style=flat-square&logo=tauri&logoColor=white)
![React](https://img.shields.io/badge/React-19.0-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Rust](https://img.shields.io/badge/Rust-1.75+-000000?style=flat-square&logo=rust&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=flat-square&logo=python&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-4.0-38B2AC?style=flat-square&logo=tailwindcss&logoColor=white)


**Local Scribe** is a privacy-first, verified offline meeting assistant tailored for **Apple Silicon**. It records, transcribes, identifies speakers (Diarization), and summarizes conversations—all without sending a single byte of data to the cloud.

---

## ✨ Features

-   **🔒 Privacy First**: All processing happens on-device. No cloud APIs, no data leaks.
-   **🧠 Local AI Stack**:
    -   **STT**: Alibaba's `SenseVoiceSmall` for high-accuracy transcription.
    -   **Diarization**: `pyannote.audio` (v3.1) for distinct speaker identification.
    -   **LLM**: Integrates with local **Ollama** instances (e.g., `qwen2.5-coder`) for summarization.
-   **⚡ Performance**: Built on **Tauri v2** (Rust) for minimal RAM usage (~30MB idle).
-   **🎨 Minimalist UI**: A clean, "Notion-style" interface focused on readability.

## 🛠️ Tech Stack

| Component | Technology | Role |
| :--- | :--- | :--- |
| **Shell** | Tauri v2 (Rust) | Native OS integration, Child Process management |
| **Frontend** | React + TypeScript | UI, State Management, Audio Visualization |
| **Styling** | Tailwind CSS v4 | Minimalist Design System |
| **Sidecar** | Python 3.12 | Runs PyTorch models (SenseVoice, Pyannote) |
| **Database** | SQLite | Local metadata and transcript storage |
| **AI** | Ollama | Local LLM Inference for Summarization |

## 🚀 Getting Started

### Prerequisites

1.  **Node.js** (v18+) & **Rust** (v1.75+)
2.  **Ollama**: Installed and running (`ollama serve`).
    *   Pull a model: `ollama pull qwen2.5-coder:7b` (or similar).
3.  **Hugging Face Token**: Required for Speaker Diarization.
    *   Accept terms for `pyannote/speaker-diarization-3.1`.
    *   Create a `.credentials` file in root: `HF_TOKEN="hf_..."`.

### Installation

```bash
# 1. Clone the repo
git clone https://github.com/your-username/local-scribe.git
cd local-scribe

# 2. Install Frontend Dependencies
npm install

# 3. Setup Python Sidecar
cd sidecar
uv sync  # Uses 'uv' for fast dependency management
# OR
pip install -r requirements.txt

# 4. Run Development Mode
cd ..
npm run tauri dev
```

## 📐 Architecture

```mermaid
graph TD
    UI[React Frontend] <-->|Commands/Events| Rust[Tauri Rust Backend]
    Rust <-->|Stdin/Stdout| Py[Python Sidecar]
    Py -->|Load| Models[SenseVoice & Pyannote]
    Rust <-->|HTTP| Ollama[Local LLM]
    Rust <-->|SQL| DB[SQLite]
```

## 🛡️ License

MIT © [Your Name]
