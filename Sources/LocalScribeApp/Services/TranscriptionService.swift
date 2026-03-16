import Foundation
import WhisperKit

class TranscriptionService {
    private var whisperPipe: WhisperKit?
    private var isLoading = false

    // CoreML models are highly optimized for Apple Silicon (M-series chips).
    // ggml-base.en offers a great balance of speed and accuracy for offline processing.
    func loadModel() async throws {
        guard whisperPipe == nil && !isLoading else { return }

        isLoading = true
        defer { isLoading = false }

        print("Initializing WhisperKit (CoreML Optimized)...")
        // Initialize WhisperKit using a standard model repository.
        // It will download and cache the model locally on first run.
        whisperPipe = try await WhisperKit(modelRepo: "argmaxinc/whisperkit-coreml", modelFolder: "openai_whisper-base")
        print("WhisperKit initialized successfully.")
    }

    func transcribe(fileURL: URL) async throws -> String {
        guard let whisper = whisperPipe else {
            throw NSError(domain: "TranscriptionService", code: 1, userInfo: [NSLocalizedDescriptionKey: "Model not loaded. Call loadModel() first."])
        }

        print("Starting transcription for \(fileURL.lastPathComponent)")

        // WhisperKit natively handles standard audio files, decodes them, and processes
        // through the CoreML inference engine on the Apple Neural Engine/GPU.
        let result = try await whisper.transcribe(audioPath: fileURL.path)

        // Return the full concatenated transcript
        let fullTranscript = result.map { $0.text }.joined(separator: "\n")
        print("Transcription complete.")
        return fullTranscript.trimmingCharacters(in: .whitespacesAndNewlines)
    }
}
