import SwiftUI

public struct ContentView: View {
    @StateObject private var viewModel = AppViewModel()

    public init() {}

    public var body: some View {
        VStack(spacing: 32) {
            header

            controlCenter
                .padding()
                .background(Color.white)
                .cornerRadius(12)
                .shadow(color: Color.black.opacity(0.05), radius: 5, x: 0, y: 2)

            contentArea

            Spacer()
        }
        .padding(40)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    // MARK: - Header
    private var header: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("🎙️")
                Text("LOCAL SCRIBE")
                    .font(.caption)
                    .fontWeight(.semibold)
                    .foregroundColor(.gray)
                Spacer()
            }

            Text("Meeting Notes")
                .font(.system(size: 48, weight: .bold, design: .serif))
                .foregroundColor(Color.primary)

            HStack {
                Text(Date().formatted(.dateTime.weekday(.wide).year().month(.wide).day()))
                    .font(.subheadline)
                    .foregroundColor(.gray)

                Text("• v1.0 (Native)")
                    .font(.subheadline)
                    .foregroundColor(.gray)
            }

            Divider()
        }
    }

    // MARK: - Control Center
    private var controlCenter: some View {
        VStack(spacing: 24) {
            Text(viewModel.formattedDuration)
                .font(.system(size: 64, weight: .regular, design: .monospaced))
                .foregroundColor(viewModel.isRecording ? .red : .primary)

            HStack(spacing: 8) {
                Circle()
                    .fill(viewModel.isRecording ? Color.red : Color.gray)
                    .frame(width: 8, height: 8)
                    .opacity(viewModel.isRecording ? 1.0 : 0.5)

                Text(viewModel.statusText)
                    .font(.caption)
                    .fontWeight(.bold)
                    .foregroundColor(viewModel.isRecording ? .red : .gray)
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
            .background(viewModel.isRecording ? Color.red.opacity(0.1) : Color.gray.opacity(0.1))
            .cornerRadius(16)

            Button(action: {
                if viewModel.isRecording {
                    viewModel.stopRecording()
                } else {
                    viewModel.startRecording()
                }
            }) {
                Text(viewModel.isRecording ? "Stop & Transcribe" : "Start Recording")
                    .font(.headline)
                    .foregroundColor(viewModel.isRecording ? .primary : .white)
                    .padding(.horizontal, 32)
                    .padding(.vertical, 16)
                    .background(viewModel.isRecording ? Color.white : Color.primary)
                    .cornerRadius(8)
                    .overlay(
                        RoundedRectangle(cornerRadius: 8)
                            .stroke(Color.gray.opacity(0.2), lineWidth: viewModel.isRecording ? 1 : 0)
                    )
            }
            .buttonStyle(.plain)
            .disabled(viewModel.isProcessing)

            if let error = viewModel.errorMessage {
                Text(error)
                    .font(.caption)
                    .foregroundColor(.red)
                    .padding()
                    .background(Color.red.opacity(0.1))
                    .cornerRadius(8)
            }
        }
    }

    // MARK: - Content Area
    private var contentArea: some View {
        HStack(alignment: .top, spacing: 32) {
            // Transcript Column
            VStack(alignment: .leading, spacing: 16) {
                HStack {
                    Text("📄")
                    Text("Transcript")
                        .font(.headline)
                    Spacer()
                }

                Divider()

                ScrollView {
                    if viewModel.isProcessing {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Transcribing via WhisperKit (Apple Silicon Optimized)...")
                                .font(.subheadline)
                                .foregroundColor(.gray)
                                .italic()
                            ProgressView()
                                .progressViewStyle(.linear)
                        }
                        .padding()
                    } else if viewModel.transcript.isEmpty {
                        Text("No transcript available.")
                            .font(.body)
                            .foregroundColor(.gray)
                            .italic()
                            .padding()
                    } else {
                        Text(viewModel.transcript)
                            .font(.system(size: 15, design: .serif))
                            .lineSpacing(4)
                            .padding()
                    }
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
                .background(Color.white)
                .cornerRadius(8)
                .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color.gray.opacity(0.2)))
            }

            // Summary Column
            VStack(alignment: .leading, spacing: 16) {
                HStack {
                    Text("✨")
                    Text("Summary")
                        .font(.headline)
                    Spacer()
                }

                Divider()

                ScrollView {
                    if viewModel.isSummarizing {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Generating Summary...")
                                .font(.subheadline)
                                .foregroundColor(.gray)
                                .italic()
                            ProgressView()
                                .progressViewStyle(.linear)
                        }
                        .padding()
                    } else if viewModel.summary.isEmpty {
                        VStack(spacing: 8) {
                            Text("🪄")
                                .font(.largeTitle)
                            Text("Summary will appear here")
                                .font(.subheadline)
                                .foregroundColor(.gray)
                                .italic()
                        }
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                    } else {
                        Text(viewModel.summary)
                            .font(.system(size: 15))
                            .lineSpacing(4)
                            .padding()
                    }
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
                .background(Color.white)
                .cornerRadius(8)
                .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color.gray.opacity(0.2)))
            }
        }
    }
}
