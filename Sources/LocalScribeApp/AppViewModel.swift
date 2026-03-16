import SwiftUI
import Combine
import Foundation

class AppViewModel: ObservableObject {
    @Published var isRecording = false
    @Published var isProcessing = false
    @Published var isSummarizing = false
    @Published var recordingDuration: TimeInterval = 0
    @Published var transcript: String = ""
    @Published var summary: String = ""
    @Published var errorMessage: String? = nil

    private var timer: Timer?
    private let audioRecorder = AudioRecorderService()
    private let transcriptionService = TranscriptionService()
    private let summarizationService = SummarizationService()

    var formattedDuration: String {
        let minutes = Int(recordingDuration) / 60
        let seconds = Int(recordingDuration) % 60
        return String(format: "%02d:%02d", minutes, seconds)
    }

    var statusText: String {
        if isRecording { return "RECORDING" }
        if isProcessing { return "TRANSCRIBING" }
        if isSummarizing { return "SUMMARIZING" }
        return "READY"
    }

    init() {
        // Load the transcription model eagerly to save time
        Task {
            do {
                try await transcriptionService.loadModel()
            } catch {
                DispatchQueue.main.async {
                    self.errorMessage = "Failed to load ML model: \(error.localizedDescription)"
                }
            }
        }
    }

    func startRecording() {
        do {
            try audioRecorder.startRecording()
            isRecording = true
            recordingDuration = 0
            transcript = ""
            summary = ""
            errorMessage = nil

            timer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] _ in
                self?.recordingDuration += 1
            }
        } catch {
            errorMessage = "Failed to start recording: \(error.localizedDescription)"
        }
    }

    func stopRecording() {
        timer?.invalidate()
        timer = nil
        isRecording = false

        if let fileURL = audioRecorder.stopRecording() {
            processAudio(at: fileURL)
        } else {
            errorMessage = "Failed to save recording."
        }
    }

    private func processAudio(at url: URL) {
        isProcessing = true

        Task {
            do {
                let result = try await transcriptionService.transcribe(fileURL: url)
                DispatchQueue.main.async {
                    self.transcript = result
                    self.isProcessing = false
                    if !result.isEmpty {
                        self.summarizeText(result)
                    }
                }
            } catch {
                DispatchQueue.main.async {
                    self.errorMessage = "Transcription failed: \(error.localizedDescription)"
                    self.isProcessing = false
                }
            }
        }
    }

    private func summarizeText(_ text: String) {
        isSummarizing = true

        Task {
            do {
                let result = try await summarizationService.summarize(text: text)
                DispatchQueue.main.async {
                    self.summary = result
                    self.isSummarizing = false
                }
            } catch {
                DispatchQueue.main.async {
                    self.errorMessage = "Summarization failed: \(error.localizedDescription)"
                    self.isSummarizing = false
                }
            }
        }
    }
}
