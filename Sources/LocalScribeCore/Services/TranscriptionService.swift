import Foundation
import WhisperKit

public class TranscriptionService {
    private var whisperPipe: WhisperKit?
    private var isLoading = false

    // A task that holds the initialization process so concurrent calls can await it
    private var initTask: Task<WhisperKit, Error>?

    public init() {}

    // CoreML models are highly optimized for Apple Silicon (M-series chips).
    // ggml-base.en offers a great balance of speed and accuracy for offline processing.
    public func loadModel() async throws {
        if let whisper = whisperPipe {
            return
        }

        if let task = initTask {
            whisperPipe = try await task.value
            return
        }

        initTask = Task {
            print("Initializing WhisperKit (CoreML Optimized)...")
            // Initialize WhisperKit. By explicitly providing a model string,
            // WhisperKit will download the model files from HuggingFace to the app's document directory
            // and cache them before attempting to load them, preventing "file not found" crashes.
            let pipe = try await WhisperKit(model: "openai_whisper-base")
            print("WhisperKit initialized successfully.")
            return pipe
        }

        whisperPipe = try await initTask?.value
        initTask = nil
    }

    public func transcribe(fileURL: URL) async throws -> String {
        if whisperPipe == nil {
            print("Model not loaded yet. Waiting for initialization to complete...")
            try await loadModel()
        }

        guard let whisper = whisperPipe else {
            throw NSError(domain: "TranscriptionService", code: 1, userInfo: [NSLocalizedDescriptionKey: "Failed to load model during transcription."])
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
