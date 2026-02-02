import os
import argparse
import logging
import sys
import traceback
from pathlib import Path
from typing import Any, Dict, List, Optional

import orjson
import torch
from funasr import AutoModel
from pyannote.audio import Pipeline

"""
Local Scribe Sidecar (Python)

This module serves as the AI processing engine for Local Scribe.
It is designed to be packaged as a standalone binary (via PyInstaller)
and communicates with the Rust backend purely via STDIN/STDOUT using JSON.

Responsibilities:
1.  Load ASR Models (SenseVoiceSmall) on the optimal device (MPS/CPU).
2.  Load Diarization Pipeline (Pyannote 3.1) using an HF_TOKEN.
3.  Process audio files to produce speaker-labeled transcripts.
"""

# Compliance:
# - Strict JSON output (via orjson)
# - No print() debugging (only stderr logging)

# Configure logging to stderr
logging.basicConfig(
    level=logging.ERROR,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stderr)],
)
logger = logging.getLogger("sidecar")


class TranscriptionService:
    """Handles audio transcription (SenseVoice) and diarization (Pyannote)."""

    def __init__(self) -> None:
        """Initialize models."""
        self.device = "mps" if torch.backends.mps.is_available() else "cpu"
        self.asr_model: Optional[Any] = None
        self.diarization_pipeline: Optional[Any] = None

    def load_models(self) -> None:
        """Load SenseVoiceSmall and Pyannote Pipeline."""
        logger.info(f"Loading models on {self.device}...")
        
        # 1. Load ASR (SenseVoice)
        try:
            self.asr_model = AutoModel(
                model="iic/SenseVoiceSmall",
                trust_remote_code=True,
                device=self.device,
                disable_update=True,
            )
        except Exception as e:
            logger.error(f"Failed to load ASR model: {e}")
            raise RuntimeError(f"ASR load failed: {e}") from e

        # 2. Load Diarization (Pyannote)
        hf_token = os.environ.get("HF_TOKEN")
        if hf_token:
            try:
                self.diarization_pipeline = Pipeline.from_pretrained(
                    "pyannote/speaker-diarization-3.1",
                    use_auth_token=hf_token
                )
                if self.diarization_pipeline:
                    self.diarization_pipeline.to(torch.device(self.device))
            except Exception as e:
                logger.error(f"Failed to load Diarization pipeline: {e}")
                # We do not crash if diarization fails, just fallback to no speakers
        else:
            logger.warning("HF_TOKEN not found. Diarization disabled.")

    def process(self, file_path: Path) -> List[Dict[str, Any]]:
        """Run ASR and Diarization, then merge results."""
        if not self.asr_model:
            raise RuntimeError("Models not loaded. Call load_model() first.")

        if not file_path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")

        logger.info(f"Processing: {file_path}")

        # --- Step 1: ASR ---
        try:
            # SenseVoice inference
            # Validate output structure in production.
            res = self.asr_model.generate(
                input=str(file_path),
                language="auto",
                use_itn=False,
                batch_size_s=60,
            )
            # SenseVoice raw result usually: [{'key': '...', 'text': '...'}]
            # It DOES NOT provide word-level timestamps by default in this mode easily.
            # Ideally we'd need word timestamps to match perfectly.
            # For this MVP, we will treat the whole file as one text block if SenseVoice gives one block,
            # BUT SenseVoice usually gives one big chunk.
            
            # Note: A better approach for accurate diarization mapping requires word-timestamps.
            # SenseVoice + FunASR can output timestamped sentences if configured.
            
            # Simple MVP Fallback:
            # We will use the diarization to find WHO spoke, but mapping EXACT text lines 
            # without word-level timestamps from ASR is imprecise. 
            # We will return the full text with the DOMINANT speaker if ASR is one chunk,
            # or try to split if we had timestamps.
            
            # Let's check what we get.
            raw_text = res[0].get("text", "") if res else ""
            
        except Exception as e:
            raise RuntimeError(f"ASR failed: {e}") from e

        # --- Step 2: Diarization ---
        speakers_events = []
        if self.diarization_pipeline:
            try:
                diarization = self.diarization_pipeline(str(file_path))
                # Collect all speaker turns
                for turn, _, speaker in diarization.itertracks(yield_label=True):
                    speakers_events.append({
                        "start": turn.start,
                        "end": turn.end,
                        "speaker": speaker
                    })
            except Exception as e:
                logger.error(f"Diarization failed: {e}")

        # --- Step 3: Result Merging (MVP Strategy) ---
        # Current Challenge:
        # SenseVoiceSmall produces high-quality text but complex timestamp mapping.
        # Pyannote produces precise speaker timestamps but no text.
        #
        # Strategy:
        # For this version, we identify the 'Dominant Speaker' (who spoke the most)
        # and assign them to the transcript block.
        #
        # Future Roadmap:
        # - Implement word-level alignment (e.g., via forced alignment)
        #   to perfectly interleave speaker changes with text.

        dominant_speaker = "Unknown"
        if speakers_events:
            # Determine dominant speaker by total duration
            speaker_durations = {}
            for event in speakers_events:
                dur = event["end"] - event["start"]
                s = event["speaker"]
                speaker_durations[s] = speaker_durations.get(s, 0.0) + dur
            dominant_speaker = max(speaker_durations, key=speaker_durations.get)

        # Return as a single segment for V1
        segments = [{
            "start": 0.0,
            "end": 0.0, # Placeholder until alignment is implemented
            "text": raw_text,
            "speaker_id": dominant_speaker
        }]

        return segments


def main() -> None:
    """CLI Entry Point."""
    parser = argparse.ArgumentParser(description="Local Scribe Sidecar")
    parser.add_argument("file_path", help="Path to audio file")
    args = parser.parse_args()

    # Default output structure
    output: Dict[str, Any] = {
        "status": "error",
        "segments": [],
        "error_message": ""
    }

    try:
        service = TranscriptionService()
        service.load_models()
        segments = service.process(Path(args.file_path))
        
        output["status"] = "success"
        output["segments"] = segments

    except Exception:
        logger.error("Critical failure", exc_info=True)
        output["status"] = "error"
        output["error_message"] = traceback.format_exc()

    finally:
        try:
            sys.stdout.buffer.write(orjson.dumps(output))
            sys.stdout.write("\n")
            sys.stdout.flush()
        except Exception as e:
            logger.critical(f"Failed to write output: {e}")
            sys.exit(1)


if __name__ == "__main__":
    main()
